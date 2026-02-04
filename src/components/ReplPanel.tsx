import { Stack, Typography } from '@suid/material';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { onCleanup, onMount } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

export interface IReplPanelProps {
  device: TTBoardDevice;
}

export function ReplPanel(props: IReplPanelProps) {
  let ref: HTMLDivElement;
  let terminal: Terminal;

  onMount(async () => {
    terminal = new Terminal({});
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    // eslint-disable-next-line solid/reactivity
    const { device } = props;

    device.attachTerminal((data) => terminal.write(data));

    terminal.onData((data) => {
      device.terminalWrite(data);
    });

    setTimeout(() => {
      terminal.open(ref);
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
        REPL tip: use <strong>Ctrl+E</strong> to enter paste mode, <strong>Ctrl+Shift+V</strong> to
        paste.
        <br />
        See the{' '}
        <a
          href="https://github.com/TinyTapeout/tt-micropython-firmware?tab=readme-ov-file#quick-start"
          target="_blank"
        >
          SDK documentation
        </a>{' '}
        for reference.
      </Typography>
    </Stack>
  );
}
