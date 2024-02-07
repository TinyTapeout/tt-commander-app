// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@suid/material';
import { For, createSignal } from 'solid-js';
import { loadProjects } from '~/model/Project';
import { TTBoardDevice, frequencyTable } from '~/ttcontrol/TTBoardDevice';
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

      <Stack direction="row" spacing={1} marginTop={2} marginBottom={2}>
        <FormControl sx={{ width: 300 }}>
          <InputLabel id="project-select-label">Project</InputLabel>

          <Select
            labelId="project-select-label"
            label="Project"
            type="number"
            size="small"
            value={activeDesign()}
            fullWidth
            onChange={(e) => e.target.value && setActiveDesign(e.target.value)}
          >
            <For each={loadProjects()}>
              {(project) => (
                <MenuItem value={project.address}>
                  {project.title} ({project.address})
                </MenuItem>
              )}
            </For>
          </Select>
        </FormControl>

        <TextField
          sx={{ maxWidth: 80 }}
          label="Index"
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

      <Stack direction="row" spacing={1} marginBottom={1}>
        <TextField
          sx={{ maxWidth: 120 }}
          label="Clock speed (Hz)"
          type="number"
          size="small"
          value={clockSpeed()}
          fullWidth
          onChange={(e) => setClockSpeed(e.target.value)}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel id="frequency-select-label">Preset</InputLabel>

          <Select
            labelId="frequency-select-label"
            label="Preset"
            type="number"
            size="small"
            value={clockSpeed()}
            fullWidth
            onChange={(e) => e.target.value && setClockSpeed(e.target.value)}
          >
            <For each={frequencyTable}>
              {(freq) => <MenuItem value={freq.value}>{freq.title}</MenuItem>}
            </For>
          </Select>
        </FormControl>

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
