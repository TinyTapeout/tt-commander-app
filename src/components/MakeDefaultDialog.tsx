// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026, Tiny Tapeout LTD

import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from '@suid/material';
import { createSignal, Match, Show, Switch } from 'solid-js';
import { DefaultProjectConfig, formatUiIn, makeDefaultProject } from '~/model/configIni';
import { Project } from '~/model/shuttle';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

export interface IMakeDefaultDialogProps {
  device: TTBoardDevice;
  project: Project;
  config: DefaultProjectConfig;
  onClose: () => void;
}

type Status = 'confirm' | 'working' | 'done' | 'error';

/** Confirms and writes the given project and settings into config.ini on the board. */
export function MakeDefaultDialog(props: IMakeDefaultDialogProps) {
  const [status, setStatus] = createSignal<Status>('confirm');
  const [error, setError] = createSignal('');

  const close = () => {
    if (status() !== 'working') {
      props.onClose();
    }
  };

  const write = async () => {
    setStatus('working');
    try {
      const existing = await props.device.readConfigFile();
      await props.device.writeConfigFile(makeDefaultProject(existing, props.config));
      setStatus('done');
    } catch (e) {
      setError((e as Error).message);
      setStatus('error');
    }
  };

  const reboot = () => {
    void props.device.reboot();
  };

  const clockDescription = () =>
    props.config.clockHz > 0 ? `${props.config.clockHz.toLocaleString()} Hz` : 'stopped';
  const uiInDescription = () =>
    props.config.uiIn != null
      ? `driven by the board (${formatUiIn(props.config.uiIn)})`
      : 'not driven';

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Make default project</DialogTitle>
      <DialogContent>
        <Switch>
          <Match when={status() === 'confirm'}>
            <DialogContentText>
              The board will load <strong>{props.project.title}</strong> ({props.project.macro})
              automatically when it powers up, with these settings:
            </DialogContentText>
            <Typography component="ul" variant="body2" sx={{ my: 1 }}>
              <li>Clock: {clockDescription()}</li>
              <li>Inputs (ui_in): {uiInDescription()}</li>
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              This modifies the <strong>config.ini</strong> file stored on the board. Other
              projects' settings in the file are preserved.
            </Alert>
          </Match>
          <Match when={status() === 'working'}>
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={24} />
              <DialogContentText>Writing config.ini to the board...</DialogContentText>
            </Stack>
          </Match>
          <Match when={status() === 'done'}>
            <Alert severity="success">
              <strong>{props.project.title}</strong> is now the default project. Reboot the board
              for the change to take effect.
            </Alert>
          </Match>
          <Match when={status() === 'error'}>
            <Alert severity="error">{error()}</Alert>
          </Match>
        </Switch>
      </DialogContent>
      <DialogActions>
        <Show when={status() === 'confirm'}>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={write} variant="contained">
            Write to board
          </Button>
        </Show>
        <Show when={status() === 'done'}>
          <Button onClick={close}>Close</Button>
          <Button onClick={reboot} variant="contained">
            Reboot board
          </Button>
        </Show>
        <Show when={status() === 'error'}>
          <Button onClick={close}>Close</Button>
          <Button onClick={write} variant="contained">
            Retry
          </Button>
        </Show>
      </DialogActions>
    </Dialog>
  );
}
