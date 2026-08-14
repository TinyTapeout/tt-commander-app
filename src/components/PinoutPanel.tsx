import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@suid/material';
import { createResource, For, Show } from 'solid-js';
import { selectedDesignAddress } from '~/model/DeviceState';
import { compareVersions } from '~/model/firmware';
import { findProject, Project, shuttle } from '~/model/shuttle';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { AnalogPinoutTable } from './AnalogPinoutTable';

interface ExtraProjectInfo {
  macro: string;
  author: string;
  description: string;
  pinout: Record<string, string>;
  analog_pins: number[];
}

const extraProjectInfo = new WeakMap<Project, ExtraProjectInfo>();

export interface IPinoutPanelProps {
  device: TTBoardDevice;
}

export function PinoutPanel(props: IPinoutPanelProps) {
  const selectedProject = () => findProject(shuttle.projects, selectedDesignAddress());

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
        {projectInfo.loading ? 'Loading...' : (selectedProject()?.title ?? 'Error')}
        <Show when={projectInfo()}> by {projectInfo()?.author}</Show>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {projectInfo.error ? 'Error loading documentation' : (projectInfo()?.description ?? '')}
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
      <Show when={selectedProject()?.type === 'subtile'}>
        <Typography variant="body2" color="textSecondary" marginTop={1}>
          Subtile project: the bidirectional (uio) pins select the active subtile, and are not
          available to the project.
        </Typography>
      </Show>
      <Show when={projectInfo()?.analog_pins.length}>
        <Typography variant="h6" marginTop={4}>
          Analog pins
        </Typography>
        <AnalogPinoutTable
          analogPins={projectInfo()?.analog_pins ?? []}
          pinout={projectInfo()?.pinout ?? {}}
          useLetterLabels={compareVersions(props.device.data.version ?? '0.0.0', '3.0.0') >= 0}
        />
      </Show>
    </Stack>
  );
}
