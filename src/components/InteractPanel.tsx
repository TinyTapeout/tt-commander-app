import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@suid/material';
import { createSignal, onCleanup, onMount, Show } from 'solid-js';
import { deviceState, updateDeviceState } from '~/model/DeviceState';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { InteractSettingsMenu } from './InteractSettingsMenu';

export interface IInteractPanelProps {
  device: TTBoardDevice;
}

export function InteractPanel(props: IInteractPanelProps) {
  const [momentaryMode, setMomentaryMode] = createSignal(false);

  const updateUiIn = async (setEnableToTrue = false) => {
    const values = deviceState.uiIn;
    let uiIn = 0;
    for (let i = 0; i < 8; i++) {
      if (values.includes(i.toString())) {
        uiIn |= 1 << i;
      }
    }
    await props.device.writeUIIn(uiIn);
    if (setEnableToTrue) {
      await props.device.enableUIIn(true);
    }
  };

  const toggleUIInBit = (index: string) => {
    if (deviceState.uiIn.includes(index.toString())) {
      updateDeviceState({ uiIn: deviceState.uiIn.filter((x) => x !== index.toString()) });
    } else {
      updateDeviceState({ uiIn: [...deviceState.uiIn, index.toString()] });
    }
    updateUiIn();
  };

  const keypressHandler = (event: KeyboardEvent) => {
    const handleUiIn = deviceState.uiInEnabled && !momentaryMode();
    if (handleUiIn && ['0', '1', '2', '3', '4', '5', '6', '7'].includes(event.key)) {
      if (deviceState.uiIn.includes(event.key)) {
        updateDeviceState({ uiIn: deviceState.uiIn.filter((x) => x !== event.key) });
      } else {
        updateDeviceState({ uiIn: [...deviceState.uiIn, event.key] });
      }
      updateUiIn();
    }
    switch (event.key.toUpperCase()) {
      case 'C':
        props.device.manualClock();
        break;

      case 'R':
        props.device.resetProject();
        break;
    }
  };

  const downUpHandler = (event: KeyboardEvent) => {
    if (!momentaryMode() || event.repeat || !deviceState.uiInEnabled) {
      return;
    }
    if (['0', '1', '2', '3', '4', '5', '6', '7'].includes(event.key)) {
      toggleUIInBit(event.key);
      updateUiIn();
    }
  };

  const pointerDownUpHandler = (event: PointerEvent) => {
    if (momentaryMode() !== event.shiftKey) {
      toggleUIInBit((event.target as HTMLButtonElement).value);
      updateUiIn();
    }
  };

  onMount(() => {
    window.addEventListener('keypress', keypressHandler);
    window.addEventListener('keydown', downUpHandler);
    window.addEventListener('keyup', downUpHandler);
  });

  onCleanup(() => {
    window.removeEventListener('keypress', keypressHandler);
    window.removeEventListener('keydown', downUpHandler);
    window.removeEventListener('keyup', downUpHandler);
  });

  // Stop monitoring uo_out when the component is unmounted, resume monitoring when mounted.
  onMount(async () => {
    if (deviceState.uoOutEnabled) {
      await props.device.terminalDetached;
      await props.device.monitorUoOut(true);
    }
  });

  onCleanup(async () => {
    if (deviceState.uoOutEnabled) {
      await props.device.monitorUoOut(false);
    }
  });

  const uiButtonStyle = {
    '&.MuiToggleButton-root.Mui-selected:not(.Mui-disabled)': {
      backgroundColor: 'success.main',
      color: 'white',
    },
  };

  return (
    <>
      <Stack direction="row" spacing={1} marginTop={2} marginBottom={2}>
        <FormControlLabel
          sx={{ minWidth: 90 }}
          control={
            <Checkbox
              checked={deviceState.uiInEnabled}
              onChange={(event, value) => {
                updateDeviceState({ uiInEnabled: value });
                if (value) {
                  void updateUiIn(true);
                } else {
                  void props.device.enableUIIn(false);
                }
              }}
            />
          }
          label="ui_in"
        />
        <ToggleButtonGroup
          color="primary"
          disabled={!deviceState.uiInEnabled}
          value={deviceState.uiIn}
          onChange={(event, values) => {
            if (momentaryMode() == event.shiftKey) {
              updateDeviceState({ uiIn: values });
              updateUiIn();
            }
          }}
          onPointerDown={pointerDownUpHandler}
          onPointerUp={pointerDownUpHandler}
        >
          <ToggleButton value="0" sx={uiButtonStyle}>
            0
          </ToggleButton>
          <ToggleButton value="1" sx={uiButtonStyle}>
            1
          </ToggleButton>
          <ToggleButton value="2" sx={uiButtonStyle}>
            2
          </ToggleButton>
          <ToggleButton value="3" sx={uiButtonStyle}>
            3
          </ToggleButton>
          <ToggleButton value="4" sx={uiButtonStyle}>
            4
          </ToggleButton>
          <ToggleButton value="5" sx={uiButtonStyle}>
            5
          </ToggleButton>
          <ToggleButton value="6" sx={uiButtonStyle}>
            6
          </ToggleButton>
          <ToggleButton value="7" sx={uiButtonStyle}>
            7
          </ToggleButton>
        </ToggleButtonGroup>
        <InteractSettingsMenu momentaryMode={momentaryMode()} setMomentaryMode={setMomentaryMode} />
      </Stack>
      <Stack direction="row" spacing={1} marginBottom={2} alignItems="center">
        <FormControlLabel
          sx={{ minWidth: 90 }}
          control={
            <Checkbox
              checked={deviceState.uoOutEnabled}
              onChange={(event, value) => {
                updateDeviceState({ uoOutEnabled: value });
                props.device.monitorUoOut(value);
              }}
            />
          }
          label="uo_out"
        />
        <Show when={deviceState.uoOutEnabled}>
          <Stack direction="row" spacing={3}>
            <code style={{ 'min-width': '2em' }}>{deviceState.uoOutValue.toString()}</code>
            <code>0x{deviceState.uoOutValue.toString(16).padStart(2, '0')}</code>
            <code>0b{deviceState.uoOutValue.toString(2).padStart(8, '0')}</code>
          </Stack>
        </Show>
      </Stack>
      <Stack direction="row">
        <Button onClick={() => props.device.resetProject()}>Reset (R)</Button>
        <Button onClick={() => props.device.manualClock()}>Clock once (C)</Button>
      </Stack>
    </>
  );
}
