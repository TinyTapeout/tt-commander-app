import {
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@suid/material';
import { createSignal } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

export interface IInteractPanelProps {
  device: TTBoardDevice;
}

export function InteractPanel(props: IInteractPanelProps) {
  const [enableIn, setEnableIn] = createSignal(false);
  const [uiIn, setUiIn] = createSignal([] as string[]);

  return (
    <>
      <Typography variant="h6" mt={1}>
        ui_in
      </Typography>
      <Stack direction="row" spacing={1} marginTop={2} marginBottom={2}>
        <FormControlLabel
          control={
            <Switch
              value={enableIn()}
              onChange={(event, value) => {
                setEnableIn(value);
                void props.device.enableUIIn(value);
              }}
            />
          }
          label="Enable"
        />
        <ToggleButtonGroup
          color="primary"
          disabled={!enableIn()}
          value={uiIn()}
          onChange={(event, values) => {
            setUiIn(values);
            let byte = 0;
            for (let i = 0; i < 8; i++) {
              if (values.includes(i.toString())) {
                byte |= 1 << i;
              }
            }
            void props.device.sendCommand(`write_ui_in(0b${byte.toString(2).padStart(8, '0')})`);
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
