import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@suid/material';
import { For } from 'solid-js';
import { loadProjects } from '~/model/Project';
import { TTBoardDevice, frequencyTable } from '~/ttcontrol/TTBoardDevice';
import { createSignal } from 'solid-js';

export interface IBoardConfigPanelProps {
  device: TTBoardDevice;
}

export function BoardConfigPanel(props: IBoardConfigPanelProps) {
  const [activeDesign, setActiveDesign] = createSignal<number>(0);
  const [clockSpeed, setClockSpeed] = createSignal<string>('10000000');

  const setClock = () => {
    void props.device.setClock(clockSpeed());
  };

  return (
    <>
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
    </>
  );
}
