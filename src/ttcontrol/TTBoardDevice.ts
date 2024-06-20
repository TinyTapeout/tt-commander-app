// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { createStore } from 'solid-js/store';
import { factoryShuttleId, isFactoryMode } from '~/model/factory';
import { loadShuttle } from '~/model/shuttle';
import { LineBreakTransformer } from '~/utils/LineBreakTransformer';
import defaultFactory from './factory/default.py?raw';
import tt03p5Factory from './factory/tt03p5.py?raw';
import ttControl from './ttcontrol.py?raw';

export const frequencyTable = [
  { title: '50 MHz', value: '50000000' },
  { title: '48 MHz', value: '48000000' },
  { title: '40 MHz', value: '40000000' },
  { title: '31.5 MHz', value: '31500000' },
  { title: '25.179 MHz', value: '25178571' },
  { title: '25 MHz', value: '25000000' },
  { title: '24 MHz', value: '24000000' },
  { title: '20 MHz', value: '20000000' },
  { title: '12 MHz', value: '12000000' },
  { title: '10 MHz', value: '10000000' },
  { title: '1 MHz', value: '1000000' },
  { title: '50 kHz', value: '50000' },
  { title: '10 kHz', value: '10000' },
];

export interface ILogEntry {
  sent: boolean;
  text: string;
}

export type TerminalListener = (data: string) => void;

export class TTBoardDevice extends EventTarget {
  private reader?: ReadableStreamDefaultReader<string>;
  private terminalReader?: ReadableStreamDefaultReader<string>;
  private readableStreamClosed?: Promise<void>;
  private writableStreamClosed?: Promise<void>;
  private writer?: WritableStreamDefaultWriter<string>;

  readonly data;
  private terminalListener: TerminalListener | null = null;
  private setData;

  constructor(readonly port: SerialPort) {
    super();
    const [data, setData] = createStore({
      deviceName: null as string | null,
      version: null as string | null,
      shuttle: null as string | null,
      logs: [] as ILogEntry[],
    });
    this.data = data;
    this.setData = setData;
  }

  async sendCommand(command: string) {
    this.setData('logs', [...this.data.logs, { text: command, sent: true }]);
    await this.writer?.write(`${command}\x04`);
  }

  async selectDesign(index: number) {
    await this.sendCommand(`select_design(${index})`);
  }

  async setClock(hz: number) {
    await this.sendCommand(`set_clock_hz(${hz})`);
  }

  async writeConfig(design: string, clock: number) {
    await this.sendCommand(`write_config(r"${design}", ${clock})`);
  }

  async factorySetup() {
    this.setData('logs', [...this.data.logs, { text: '<<< factory setup >>>', sent: true }]);
    const script = factoryShuttleId() == 'tt03p5' ? tt03p5Factory : defaultFactory;
    await this.writer?.write(script + '\x04'); // Send the factory-tt03p5.py script and excute it.
  }

  async bootloader() {
    await this.sendCommand('import machine; machine.bootloader()');
  }

  async enableUIIn(enable: boolean) {
    await this.sendCommand(`enable_ui_in(${enable ? 'True' : 'False'})`);
  }

  async resetProject() {
    await this.sendCommand('reset_project()');
  }

  async manualClock() {
    await this.sendCommand('manual_clock()');
  }

  async attachTerminal(listener: TerminalListener) {
    this.writer?.write('\x02'); // Send Ctrl+B to exit RAW REPL mode.
    this.terminalListener = listener;
  }

  async detachTerminal() {
    this.terminalListener = null;
    await this.writer?.write('\x03\x03'); // Send Ctrl+C twice to stop any running program.
    await this.writer?.write('\x01'); // Send Ctrl+A to enter RAW REPL mode.
  }

  async terminalWrite(data: string) {
    await this.writer?.write(data);
  }

  private processInput(line: string) {
    const [name, value] = line.split(/=(.+)/);
    if (name === 'firmware') {
      this.setData('deviceName', value);
    }
    if (name === 'version') {
      this.setData('version', value);
    }
    if (name === 'shuttle') {
      this.setData('shuttle', value);
      if (!isFactoryMode()) {
        loadShuttle(value);
      }
    }
    if (name === 'protocol' && value !== '1') {
      alert('Warning: unsupported protocol version.');
    }
  }

  start() {
    void this.run();

    const textEncoderStream = new TextEncoderStream();
    this.writer = textEncoderStream.writable.getWriter();
    this.writableStreamClosed = textEncoderStream.readable.pipeTo(this.port.writable);
    this.writer.write('\x03\x03'); // Send Ctrl+C twice to stop any running program.
    this.writer.write('\x01'); // Send Ctrl+A to enter RAW REPL mode.
    this.writer.write(ttControl + '\x04'); // Send the demo.py script and excute it.
    this.sendCommand('read_rom()');
  }

  private async run() {
    const { port } = this;

    function cleanupRawREPL(value: string) {
      // eslint-disable-next-line no-control-regex
      return value.replace(/^(\x04+>OK)+\x04*/, '');
    }

    while (port.readable) {
      const textDecoder = new TextDecoderStream();
      this.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const [stream1, stream2] = textDecoder.readable.tee();
      this.reader = stream1
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();

      this.terminalReader = stream2.getReader();
      this.processTerminalStream(this.terminalReader);

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            this.reader.releaseLock();
            return;
          }
          if (value && !this.terminalListener) {
            const cleanValue = cleanupRawREPL(value);
            this.processInput(cleanValue);
            this.setData('logs', [...this.data.logs, { text: cleanValue, sent: false }]);
          }
        }
      } catch (error) {
        console.error('SerialReader error:', error);
        this.dispatchEvent(new Event('close'));
      } finally {
        this.reader.releaseLock();
      }
    }
  }

  async processTerminalStream(reader: ReadableStreamDefaultReader<string>) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        return;
      }
      if (value) {
        if (this.terminalListener) {
          this.terminalListener(value);
        }
      }
    }
  }

  async close() {
    await this.reader?.cancel();
    await this.terminalReader?.cancel();
    await this.readableStreamClosed?.catch(() => {});

    try {
      await this.writer?.write('\x02\x03\x03'); // Exit RAW REPL mode and stop any running code.
    } catch (e) {
      console.warn('Failed to exit RAW REPL mode:', e);
    }

    await this.writer?.close();
    await this.writableStreamClosed?.catch(() => {});

    await this.port.close();
    this.dispatchEvent(new Event('close'));
  }
}
