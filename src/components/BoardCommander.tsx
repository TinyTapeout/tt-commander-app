// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Button, MenuItem, Select, Stack, TextField, Typography } from '@suid/material';
import { For, createSignal } from 'solid-js';
import { TTBoardDevice, frequencyTable } from '~/ttboard/TTBoardDevice';
import { DebugLogs } from './DebugLogs';

export interface IBreakoutControlProps {
  onDisconnect: () => void;
  device: TTBoardDevice;
}

export function BoardCommander(props: IBreakoutControlProps) {
  const [activeDesign, setActiveDesign] = createSignal<number>(0);
  const [clockSpeed, setClockSpeed] = createSignal<string>('10000000');

  const disconnect = () => {
    props.device.close();
    props.onDisconnect();
  };

  const setClock = () => {
    void props.device.setClock(clockSpeed());
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

      <Stack direction="row" spacing={1} marginTop={2} marginBottom={1} maxWidth={220}>
        <TextField
          label="Active design"
          type="number"
          size="small"
          value={activeDesign()}
          fullWidth
          onChange={(e) => setActiveDesign((e.target as HTMLInputElement).valueAsNumber)}
        />
        <Button onClick={() => props.device.selectDesign(activeDesign())} variant="contained">
          Select
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} marginBottom={1} maxWidth={220}>
        <Select
          label="Clock speed"
          type="number"
          size="small"
          value={clockSpeed()}
          fullWidth
          onChange={(e) => setClockSpeed(e.target.value)}
        >
          <For each={frequencyTable}>
            {(freq) => <MenuItem value={freq.value}>{freq.title}</MenuItem>}
          </For>
        </Select>
        <Button onClick={setClock} variant="contained">
          Set
        </Button>
      </Stack>

      <DebugLogs logs={props.device.data.logs} />

      <Stack marginTop={1} direction="row">
        <Button onClick={() => props.device.bootloader()} variant="outlined">
          Reset to Bootloader
        </Button>
      </Stack>
    </Stack>
  );
}
