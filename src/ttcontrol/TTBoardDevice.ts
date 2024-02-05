// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { createStore } from 'solid-js/store';
import { LineBreakTransformer } from '~/utils/LineBreakTransformer';
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

export class TTBoardDevice {
  private reader?: ReadableStreamDefaultReader<string>;
  private readableStreamClosed?: Promise<void>;
  private writableStreamClosed?: Promise<void>;
  private writer?: WritableStreamDefaultWriter<string>;

  readonly data;
  private setData;

  constructor(readonly port: SerialPort) {
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

  async setClock(hz: string) {
    await this.sendCommand(`set_clock_hz(${hz})`);
  }

  async bootloader() {
    await this.sendCommand('import machine; machine.bootloader()');
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
      return value.replace(/^\x04+>OK\x04*/, '');
    }

    while (port.readable) {
      const textDecoder = new TextDecoderStream();
      this.readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      this.reader = textDecoder.readable
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .getReader();

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { value, done } = await this.reader.read();
          if (done) {
            this.reader.releaseLock();
            return;
          }
          if (value) {
            const cleanValue = cleanupRawREPL(value);
            this.processInput(cleanValue);
            this.setData('logs', [...this.data.logs, { text: cleanValue, sent: false }]);
          }
        }
      } catch (error) {
        console.error('SerialReader error:', error);
      } finally {
        this.reader.releaseLock();
      }
    }
  }

  async close() {
    await this.reader?.cancel();
    await this.readableStreamClosed?.catch(() => {});

    await this.writer?.close();
    await this.writableStreamClosed?.catch(() => {});

    await this.port.close();
  }
}
