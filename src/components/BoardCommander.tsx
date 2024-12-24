// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, ButtonGroup, Link, Paper, Stack, Typography } from '@suid/material';
import { Show, createSignal } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { BoardConfigPanel } from './BoardConfigPanel';
import { DebugLogs } from './DebugLogs';
import { FlashPanel } from './FlashPanel';
import { InteractPanel } from './InteractPanel';
import { PinoutPanel } from './PinoutPanel';
import { ReplPanel } from './ReplPanel';

export interface IBreakoutControlProps {
  device: TTBoardDevice;
}

type ITabName = 'config' | 'interact' | 'pinout' | 'repl' | 'flash';

export function BoardCommander(props: IBreakoutControlProps) {
  const [activeTab, setActiveTab] = createSignal<ITabName>('config');

  const disconnect = () => {
    props.device.close();
  };

  const shuttleId = () => props.device.data.shuttle;
  const shuttleUrl = () => {
    const id = shuttleId();
    if (id?.startsWith('tt') && id.length === 4) {
      return `https://tinytapeout.com/${id}`;
    }
  };

  return (
    <Stack mt={2}>
      <Stack direction="row" spacing={1} marginBottom={2} alignItems="center">
        <Stack flex={1} marginRight={1}>
          <Typography>
            Shuttle:{' '}
            <Show when={shuttleUrl()}>
              <Link href={shuttleUrl()} target="_blank" rel="noopener noreferrer">
                <strong>{shuttleId()}</strong>
              </Link>
            </Show>
            <Show when={!shuttleUrl()}>
              <strong>{shuttleId() ?? '<unknown>'}</strong>
            </Show>
          </Typography>
          <Typography>
            Firmware: <strong>{props.device.data.version ?? '<unknown>'}</strong>
          </Typography>
        </Stack>
        <Button onClick={disconnect} variant="outlined">
          Disconnect
        </Button>
      </Stack>

      <Paper sx={{ padding: 1 }}>
        <ButtonGroup>
          <Button
            onClick={() => setActiveTab('config')}
            variant={activeTab() === 'config' ? 'contained' : 'outlined'}
          >
            Config
          </Button>
          <Button
            onClick={() => setActiveTab('interact')}
            variant={activeTab() === 'interact' ? 'contained' : 'outlined'}
          >
            Interact
          </Button>
          <Button
            onClick={() => setActiveTab('pinout')}
            variant={activeTab() === 'pinout' ? 'contained' : 'outlined'}
          >
            Pinout
          </Button>
          <Button
            onClick={() => setActiveTab('repl')}
            variant={activeTab() === 'repl' ? 'contained' : 'outlined'}
          >
            REPL
          </Button>
          <Button
            onClick={() => setActiveTab('flash')}
            variant={activeTab() === 'flash' ? 'contained' : 'outlined'}
          >
            Flash
          </Button>
        </ButtonGroup>
        <Show when={activeTab() === 'config'}>
          <BoardConfigPanel device={props.device} />
        </Show>
        <Show when={activeTab() === 'interact'}>
          <InteractPanel device={props.device} />
        </Show>
        <Show when={activeTab() === 'pinout'}>
          <PinoutPanel />
        </Show>
        <Show when={activeTab() === 'repl'}>
          <ReplPanel device={props.device} />
        </Show>
        <Show when={activeTab() === 'flash'}>
          <FlashPanel device={props.device} />
        </Show>
      </Paper>

      <DebugLogs logs={props.device.data.logs} />

      <Stack marginTop={1} direction="row">
        <Button onClick={() => props.device.bootloader()} variant="outlined">
          Reset to Bootloader
        </Button>
      </Stack>
    </Stack>
  );
}
