// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, ButtonGroup, Paper, Stack, Typography } from '@suid/material';
import { Show, createSignal } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { BoardConfigPanel } from './BoardConfigPanel';
import { DebugLogs } from './DebugLogs';
import { InteractPanel } from './InteractPanel';

export interface IBreakoutControlProps {
  onDisconnect: () => void;
  device: TTBoardDevice;
}

type ITabName = 'config' | 'interact';

export function BoardCommander(props: IBreakoutControlProps) {
  const [activeTab, setActiveTab] = createSignal<ITabName>('config');

  const disconnect = () => {
    props.device.close();
    props.onDisconnect();
  };

  return (
    <Stack mt={2}>
      <Stack direction="row" spacing={1} marginBottom={2} alignItems="center">
        <Stack flex={1} marginRight={1}>
          <Typography>
            Shuttle: <strong>{props.device.data.shuttle ?? '<unknown>'}</strong>
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
        </ButtonGroup>
        <Show when={activeTab() === 'config'}>
          <BoardConfigPanel device={props.device} />
        </Show>
        <Show when={activeTab() === 'interact'}>
          <InteractPanel device={props.device} />
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
