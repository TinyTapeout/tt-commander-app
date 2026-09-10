import { Stack, Typography } from '@suid/material';
import { FitAddon } from '@xterm/addon-fit';
import { onCleanup, onMount } from 'solid-js';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

import uartScript from '~/ttcontrol/uart.py?raw';

export interface IUARTPanelProps {
  device: TTBoardDevice;
}

export function UARTPanel(props: IUARTPanelProps) {
  let ref: HTMLDivElement;
  let terminal: Terminal;

  onMount(async () => {
    terminal = new Terminal({});
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // eslint-disable-next-line solid/reactivity
    const { device } = props;

    // Start UART monitoring
    device.attachTerminal((data) => terminal.write(data));

    terminal.onData((data) => {
      device.terminalWrite(data);
    });

    setTimeout(() => {
      terminal.open(ref);

      // Send Ctrl+E to enter paste mode
      device.terminalWrite(`\x05`);
      // Send the UART script
      device.terminalWrite(uartScript);
      // Send Ctrl+D to exit paste mode
      device.terminalWrite(`\x04`);

      fitAddon.fit();
      terminal.focus();
    });

    onCleanup(() => {
      device.detachTerminal();
    });
  });

  return (
    <Stack>
      <div ref={ref!} />
      <Typography marginTop={0.5}>
        UART Monitor: TX on ui_in3, RX on uo_out4 at 115200 baud
      </Typography>
    </Stack>
  );
}
