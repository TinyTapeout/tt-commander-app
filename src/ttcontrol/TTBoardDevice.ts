// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { createStore } from 'solid-js/store';
import { updateDeviceState } from '~/model/DeviceState';
import { loadShuttle } from '~/model/shuttle';
import { LineBreakTransformer } from '~/utils/LineBreakTransformer';
import ttControl from './ttcontrol.py?raw';
import { compareVersions } from '~/model/firmware';

export const frequencyTable = [
  { title: '100 MHz', value: '100000000' },
  { title: '75 MHz', value: '75000000' },
  { title: '50 MHz', value: '50000000' },
  { title: '48 MHz', value: '48000000' },
  { title: '40 MHz', value: '40000000' },
  { title: '30 MHz', value: '30000000' },
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

const MAX_LOG_ENTRIES = 1000;

export class TTBoardDevice extends EventTarget {
  private reader?: ReadableStreamDefaultReader<string>;
  private terminalReader?: ReadableStreamDefaultReader<string>;
  private readableStreamClosed?: Promise<void>;
  private writableStreamClosed?: Promise<void>;
  private writer?: WritableStreamDefaultWriter<string>;

  private terminalDetachedPromise? = Promise.resolve();
  private terminalDetachedResolve?: () => void;
  get terminalDetached() {
    return this.terminalDetachedPromise;
  }

  readonly data;
  private terminalListener: TerminalListener | null = null;
  private setData;

  constructor(readonly port: SerialPort) {
    super();
    const [data, setData] = createStore({
      boot: false,
      version: null as string | null,
      shuttle: null as string | null,
      logs: [] as ILogEntry[],
    });
    this.data = data;
    this.setData = setData;
  }

  private addLogEntry(entry: ILogEntry) {
    const newLogs = [...this.data.logs, entry];
    if (newLogs.length > MAX_LOG_ENTRIES) {
      newLogs.shift();
    }
    this.setData('logs', newLogs);
  }

  async sendCommand(command: string, log = true) {
    if (log) {
      this.addLogEntry({ text: command, sent: true });
    }
    await this.writer?.write(`${command}\x04`);
  }

  async syncState() {
    await this.sendCommand('dump_state()');
  }

  async selectDesign(index: number, clockHz?: number) {
    const clockArg = clockHz != null ? `, ${clockHz}` : '';
    await this.sendCommand(`select_design(${index}${clockArg})`);
  }

  async setClock(hz: number) {
    let freqArg = '';
    if (this.data.version && compareVersions(this.data.version, '2.0.4') >= 0) {
      freqArg = `, max_rp2040_freq=200_000_000`;
    }
    await this.sendCommand(`set_clock_hz(${hz}${freqArg})`);
  }

  async writeConfig(design: string, clock: number) {
    await this.sendCommand(`write_config(r"${design}", ${clock})`);
  }

  async factorySetup() {
    this.addLogEntry({ text: '<<< factory setup >>>', sent: true });
    await this.sendCommand('run_factory_test()');
  }

  async bootloader() {
    await this.sendCommand('import machine; machine.bootloader()');
  }

  async enableUIIn(enable: boolean) {
    await this.sendCommand(`enable_ui_in(${enable ? 'True' : 'False'})`);
  }

  async writeUIIn(value: number) {
    await this.sendCommand(`write_ui_in(0b${value.toString(2).padStart(8, '0')})`);
  }

  async monitorUoOut(enable: boolean) {
    const monitorFreq = 10;
    await this.sendCommand(`monitor_uo_out(${enable ? monitorFreq : '0'})`);
  }

  async stopAllMonitoring() {
    await this.sendCommand('stop_all_monitoring()', false);
  }

  async resetProject() {
    await this.sendCommand('reset_project()');
  }

  async manualClock() {
    await this.sendCommand('manual_clock()');
  }

  async attachTerminal(listener: TerminalListener) {
    this.terminalDetachedPromise = new Promise((resolve) => {
      this.terminalDetachedResolve = resolve;
    });
    await this.stopAllMonitoring();
    this.writer?.write('\x02'); // Send Ctrl+B to exit RAW REPL mode.
    this.terminalListener = listener;
  }

  async detachTerminal() {
    this.terminalListener = null;
    await this.writer?.write('\x03\x03'); // Send Ctrl+C twice to stop any running program.
    await this.writer?.write('\x01'); // Send Ctrl+A to enter RAW REPL mode.
    await this.syncState();
    this.terminalDetachedResolve?.();
  }

  async terminalWrite(data: string) {
    await this.writer?.write(data);
  }

  private processInput(line: string) {
    if (line.startsWith('BOOT: ')) {
      this.setData('boot', true);
      return;
    }

    const [name, value] = line.split(/=(.+)/);
    switch (name) {
      case 'tt.sdk_version':
        this.setData('version', value.replace(/^release_v/, ''));
        break;

      case 'tt.mode':
        updateDeviceState({ uiInEnabled: value === 'ASIC_RP_CONTROL' });
        break;

      case 'tt.uo_out':
        updateDeviceState({ uoOutValue: parseInt(value, 10) });
        break;

      case 'tt.design':
        updateDeviceState({ selectedDesign: parseInt(value, 10) });
        break;

      case 'tt.clk_freq':
        updateDeviceState({ clockHz: parseInt(value, 10) });
        break;

      case 'shuttle':
        this.setData('shuttle', value);
        loadShuttle(value);
        break;
    }
  }

  async start() {
    void this.run();

    const textEncoderStream = new TextEncoderStream();
    this.writer = textEncoderStream.writable.getWriter();
    this.writableStreamClosed = textEncoderStream.readable.pipeTo(this.port.writable);
    if (this.data.version == null) {
      await this.writer.write('\n'); // Send a newlines to get REPL prompt.
      await this.writer.write('print(f"tt.sdk_version={tt.version}")\r\n');
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait for the response.
    }
    if (this.data.boot) {
      // Wait for the board to finish booting, up to 6 seconds:
      for (let i = 0; i < 60; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        if (this.data.version) {
          break;
        }
      }
    }
    if (this.data.version == null) {
      // The following sequence tries to ensure clean reboot:
      // Send Ctrl+C twice to stop any running program,
      // followed by Ctrl+B to exit RAW REPL mode (if it was entered),
      // and finally Ctrl+D to soft reset the board.
      await this.writer.write('\x03\x03\x02');
      await this.writer.write('\x04');
    }
    await this.writer.write('\x01'); // Send Ctrl+A to enter RAW REPL mode.
    await this.writer.write(ttControl + '\x04'); // Send the ttcontrol.py script and execute it.
    await this.sendCommand('read_rom()');
    await this.syncState();
  }

  private async run() {
    const { port } = this;

    function cleanupRawREPL(value: string) {
      /* eslint-disable no-control-regex */
      return (
        value
          // Remove the OK responses:
          .replace(/^(\x04+>OK)+\x04*/, '')
          // Remove ANSI escape codes:
          .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
      );
      /* eslint-enable no-control-regex */
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
            this.addLogEntry({ text: cleanValue, sent: false });
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
      await this.stopAllMonitoring();
      await this.writer?.write('\x03\x03\x02'); // Stop any running code and exit the RAW REPL mode.
    } catch (e) {
      console.warn('Failed to exit RAW REPL mode:', e);
    }

    await this.writer?.close();
    await this.writableStreamClosed?.catch(() => {});

    await this.port.close();
    this.dispatchEvent(new Event('close'));
  }
}
