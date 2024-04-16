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
import YAML from 'yaml';
import { deviceState } from '~/model/DeviceState';
import { shuttle } from '~/model/shuttle';
import { extractRepoFromURL } from '~/utils/github';

export function PinoutPanel() {
  const selectedProject = () =>
    shuttle.projects.find((p) => p.address === deviceState.selectedDesign);

  const [infoYaml] = createResource(async () => {
    const project = selectedProject();
    if (!project) {
      return null;
    }
    const repoName = extractRepoFromURL(project.repo);
    const response = await fetch(`https://raw.githubusercontent.com/${repoName}/main/info.yaml`);
    const yaml = await response.text();
    const projectInfo = YAML.parse(yaml);
    return projectInfo;
  });

  const pins = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <Stack mt={1}>
      <Typography variant="h6">
        {infoYaml.loading ? 'Loading...' : infoYaml().documentation?.title ?? 'Error'}
        <Show when={infoYaml()?.documentation}> by {infoYaml()?.documentation.author}</Show>
      </Typography>
      <Typography variant="body2" color="textSecondary">
        {infoYaml.error
          ? 'Error loading documentation'
          : infoYaml()?.documentation?.description ?? ''}
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
        <Show when={!infoYaml.loading && !infoYaml.error}>
          <TableBody>
            <For each={pins}>
              {(pinIndex) => (
                <TableRow>
                  <TableCell>{pinIndex}</TableCell>
                  <TableCell>{infoYaml().documentation.inputs?.[pinIndex] ?? ''}</TableCell>
                  <TableCell>{infoYaml().documentation.outputs?.[pinIndex] ?? ''}</TableCell>
                  <TableCell>{infoYaml().documentation.bidirectional?.[pinIndex] ?? ''}</TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Show>
      </Table>
    </Stack>
  );
}
