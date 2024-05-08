import { onCleanup, onMount } from 'solid-js';
import { Terminal } from 'xterm';
import 'xterm/css/xterm.css';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { FitAddon } from '@xterm/addon-fit';

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

  return <div ref={ref!} />;
}
