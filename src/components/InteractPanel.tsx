import { Checkbox, FormControlLabel, Stack, ToggleButton, ToggleButtonGroup } from '@suid/material';
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
  };

  onMount(() => {
    window.addEventListener('keypress', handler);
  });

  onCleanup(() => {
    window.removeEventListener('keypress', handler);
  });

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
          <ToggleButton value="0">0</ToggleButton>
          <ToggleButton value="1">1</ToggleButton>
          <ToggleButton value="2">2</ToggleButton>
          <ToggleButton value="3">3</ToggleButton>
          <ToggleButton value="4">4</ToggleButton>
          <ToggleButton value="5">5</ToggleButton>
          <ToggleButton value="6">6</ToggleButton>
          <ToggleButton value="7">7</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
    </>
  );
}
