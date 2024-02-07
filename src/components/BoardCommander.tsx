// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, Stack, Typography } from '@suid/material';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { DebugLogs } from './DebugLogs';
import { BoardConfigPanel } from './BoardConfigPanel';

export interface IBreakoutControlProps {
  onDisconnect: () => void;
  device: TTBoardDevice;
}

export function BoardCommander(props: IBreakoutControlProps) {
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

      <BoardConfigPanel device={props.device} />

      <DebugLogs logs={props.device.data.logs} />

      <Stack marginTop={1} direction="row">
        <Button onClick={() => props.device.bootloader()} variant="outlined">
          Reset to Bootloader
        </Button>
      </Stack>
    </Stack>
  );
}
