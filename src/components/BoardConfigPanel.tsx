import { PrecisionManufacturing, Save } from '@suid/icons-material';
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
import { For, Show } from 'solid-js';
import { deviceState, updateDeviceState } from '~/model/DeviceState';
import { isFactoryMode } from '~/model/factory';
import { shuttle } from '~/model/shuttle';
import { TTBoardDevice, frequencyTable } from '~/ttcontrol/TTBoardDevice';

export interface IBoardConfigPanelProps {
  device: TTBoardDevice;
}

export function BoardConfigPanel(props: IBoardConfigPanelProps) {
  const setClock = () => {
    void props.device.setClock(deviceState.clockHz);
  };

  const selectedProject = () =>
    shuttle.projects.find((p) => p.address === deviceState.selectedDesign);

  const writeConfigIni = () => {
    void props.device.writeConfig(
      selectedProject()?.macro ?? deviceState.selectedDesign.toString(),
      deviceState.clockHz,
    );
  };

  const repo = () => {
    const project = shuttle.projects.find((p) => p.address === deviceState.selectedDesign);
    return project?.repo;
  };

  return (
    <>
      <Stack direction="row" spacing={1} marginTop={2} marginBottom={2}>
        <FormControl sx={{ width: 300 }}>
          <InputLabel id="project-select-label">Project</InputLabel>

          <Show when={!shuttle.loading}>
            <Select
              labelId="project-select-label"
              label="Project"
              type="number"
              size="small"
              value={deviceState.selectedDesign}
              fullWidth
              onChange={(e) =>
                e.target.value && updateDeviceState({ selectedDesign: e.target.value })
              }
            >
              <For each={shuttle.projects}>
                {(project) => (
                  <MenuItem value={project.address}>
                    {project.title} ({project.address})
                  </MenuItem>
                )}
              </For>
            </Select>
          </Show>
          <Show when={shuttle.loading}>
            <Select
              labelId="project-select-label"
              label="Project"
              type="number"
              size="small"
              value={0}
              fullWidth
              disabled
            >
              <MenuItem value={0}>Loading projects...</MenuItem>
            </Select>
          </Show>
        </FormControl>

        <TextField
          sx={{ maxWidth: 80 }}
          label="Index"
          type="number"
          size="small"
          value={deviceState.selectedDesign}
          fullWidth
          onChange={(e) =>
            updateDeviceState({ selectedDesign: (e.target as HTMLInputElement).valueAsNumber })
          }
        />
        <Button
          onClick={() => props.device.selectDesign(deviceState.selectedDesign)}
          variant="contained"
        >
          Select
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} marginBottom={1}>
        <TextField
          sx={{ maxWidth: 120 }}
          label="Clock speed (Hz)"
          type="number"
          size="small"
          value={deviceState.clockHz}
          fullWidth
          onChange={(e) => updateDeviceState({ clockHz: e.target.value })}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel id="frequency-select-label">Preset</InputLabel>

          <Select
            labelId="frequency-select-label"
            label="Preset"
            type="number"
            size="small"
            value={deviceState.clockHz}
            fullWidth
            onChange={(e) => e.target.value && updateDeviceState({ clockHz: e.target.value })}
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

      <Stack my={1} direction="row" spacing={1}>
        <Show when={false}>
          <Button onClick={writeConfigIni} variant="contained" startIcon={<Save />}>
            Persist config to board
          </Button>
        </Show>

        <Show when={isFactoryMode()}>
          <Button
            sx={{ backgroundColor: 'orange' }}
            onClick={() => props.device.factorySetup()}
            variant="outlined"
            startIcon={<PrecisionManufacturing />}
          >
            Factory Test
          </Button>
        </Show>
      </Stack>

      <Show when={repo()}>
        <Typography>
          Repo:{' '}
          <a href={repo()} target="_blank">
            {repo()}
          </a>
        </Typography>
      </Show>
    </>
  );
}
