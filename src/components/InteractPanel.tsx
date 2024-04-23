import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@suid/material';
import { onCleanup, onMount } from 'solid-js';
import { deviceState, updateDeviceState } from '~/model/DeviceState';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

export interface IInteractPanelProps {
  device: TTBoardDevice;
}

export function InteractPanel(props: IInteractPanelProps) {
  const updateUiIn = () => {
    const values = deviceState.uiIn;
    let byte = 0;
    for (let i = 0; i < 8; i++) {
      if (values.includes(i.toString())) {
        byte |= 1 << i;
      }
    }
    void props.device.sendCommand(`write_ui_in(0b${byte.toString(2).padStart(8, '0')})`);
  };

  const handler = (event: KeyboardEvent) => {
    if (['0', '1', '2', '3', '4', '5', '6', '7'].includes(event.key)) {
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

  onMount(() => {
    window.addEventListener('keypress', handler);
  });

  onCleanup(() => {
    window.removeEventListener('keypress', handler);
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
          control={
            <Checkbox
              checked={deviceState.uiInEnabled}
              onChange={(event, value) => {
                updateDeviceState({ uiInEnabled: value });
                void props.device.enableUIIn(value);
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
            updateDeviceState({ uiIn: values });
            updateUiIn();
          }}
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
      </Stack>
      <Stack direction="row">
        <Button onClick={() => props.device.resetProject()}>Reset (R)</Button>
        <Button onClick={() => props.device.manualClock()}>Clock once (C)</Button>
      </Stack>
    </>
  );
}
