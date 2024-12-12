import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@suid/material';
import { For, Show, createResource } from 'solid-js';
import { deviceState } from '~/model/DeviceState';
import { Project, shuttle } from '~/model/shuttle';
import { AnalogPinoutTable } from './AnalogPinoutTable';

interface ExtraProjectInfo {
  macro: string;
  author: string;
  description: string;
  pinout: Record<string, string>;
  analog_pins: number[];
}

const extraProjectInfo = new WeakMap<Project, ExtraProjectInfo>();

export function PinoutPanel() {
  const selectedProject = () =>
    shuttle.projects.find((p) => p.address === deviceState.selectedDesign);

  const [projectInfo] = createResource(async () => {
    const project = selectedProject();
    if (!project) {
      return null;
    }

    const cached = extraProjectInfo.get(project);
    if (cached) {
      return cached;
    }

    const response = await fetch(
      `https://index.tinytapeout.com/${shuttle.id}.json?fields=author,description,pinout,analog_pins&filter=${project.macro}`,
    );
    const json: { projects: ExtraProjectInfo[] } = await response.json();
    const result = json.projects.find((p) => p.macro === project.macro);
    if (result) {
      extraProjectInfo.set(project, result);
    }
    return result;
  });

  const pins = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <Stack mt={1}>
      <Typography variant="h6">
        {projectInfo.loading ? 'Loading...' : selectedProject()?.title ?? 'Error'}
        <Show when={projectInfo()}> by {projectInfo()?.author}</Show>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {projectInfo.error ? 'Error loading documentation' : projectInfo()?.description ?? ''}
      </Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>#</TableCell>
            <TableCell>Input</TableCell>
            <TableCell>Output</TableCell>
            <TableCell>Bidirectional</TableCell>
          </TableRow>
        </TableHead>
        <Show when={!projectInfo.loading && !projectInfo.error}>
          <TableBody>
            <For each={pins}>
              {(pinIndex) => (
                <TableRow>
                  <TableCell>{pinIndex}</TableCell>
                  <TableCell>{projectInfo()?.pinout[`ui[${pinIndex}]`] ?? ''}</TableCell>
                  <TableCell>{projectInfo()?.pinout[`uo[${pinIndex}]`] ?? ''}</TableCell>
                  <TableCell>{projectInfo()?.pinout[`uio[${pinIndex}]`]}</TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Show>
      </Table>
      <Show when={projectInfo()?.analog_pins.length}>
        <Typography variant="h6" marginTop={4}>
          Analog pins
        </Typography>
        <AnalogPinoutTable
          analogPins={projectInfo()?.analog_pins ?? []}
          pinout={projectInfo()?.pinout ?? {}}
        />
      </Show>
    </Stack>
  );
}
