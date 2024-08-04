import { Settings } from '@suid/icons-material';
import {
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  MenuList,
  Popover,
} from '@suid/material';
import { createSignal } from 'solid-js';

export interface IInteractSettingsProps {
  momentaryMode: boolean;
  setMomentaryMode: (value: boolean) => void;
}

export function InteractSettingsMenu(props: IInteractSettingsProps) {
  const [anchorEl, setAnchorEl] = createSignal<HTMLButtonElement | null>(null);

  const handleClick = (event: MouseEvent & { currentTarget: HTMLButtonElement }) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = () => Boolean(anchorEl());
  const id = () => (open() ? 'interact-settings-popover' : undefined);

  return (
    <>
      <IconButton onClick={handleClick}>
        <Settings />
      </IconButton>
      <Popover
        id={id()}
        open={open()}
        anchorEl={anchorEl()}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuList>
          <MenuItem>
            <FormControlLabel
              control={
                <Checkbox
                  name="momentary"
                  checked={props.momentaryMode}
                  onChange={(event, checked) => {
                    props.setMomentaryMode(checked);
                  }}
                />
              }
              label="Momentary pushbutton mode"
            />
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  );
}
