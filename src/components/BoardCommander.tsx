// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, ButtonGroup, Link, Paper, Stack, Typography } from '@suid/material';
import { Show, createSignal } from 'solid-js';
import {
  firmwareDownloadURL,
  isLatestFirmwareVersion,
  latestFirmwareVersion,
} from '~/model/firmware';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { BoardConfigPanel } from './BoardConfigPanel';
import { DebugLogs } from './DebugLogs';
import { InteractPanel } from './InteractPanel';
import { PinoutPanel } from './PinoutPanel';
import { ReplPanel } from './ReplPanel';
import { UARTPanel } from './UARTPanel';

export interface IBreakoutControlProps {
  device: TTBoardDevice;
}

type ITabName = 'config' | 'interact' | 'pinout' | 'repl' | 'uart';

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
            <Show
              when={
                props.device.data.version && !isLatestFirmwareVersion(props.device.data.version)
              }
            >
              <Link
                sx={{
                  marginLeft: 1,
                  color: 'white',
                  background: '#f44336',
                  textDecoration: 'none',
                  padding: 1,
                }}
                href={firmwareDownloadURL(latestFirmwareVersion)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Upgrade available
              </Link>
            </Show>
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
            onClick={() => setActiveTab('uart')}
            variant={activeTab() === 'uart' ? 'contained' : 'outlined'}
          >
            UART
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
        <Show when={activeTab() === 'uart'}>
          <UARTPanel device={props.device} />
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
