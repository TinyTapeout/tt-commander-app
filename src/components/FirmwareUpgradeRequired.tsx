import { Box, Button, List, ListItem, ListItemText, Paper, Typography } from '@suid/material';
import { firmwareDownloadURL, latestFirmwareVersion } from '~/model/firmware';
import { type TTBoardDevice } from '~/ttcontrol/TTBoardDevice';

export interface IFirmwareUpgradeRequiredProps {
  device?: TTBoardDevice;
}

const latestFirmwareUrl = firmwareDownloadURL(latestFirmwareVersion);
const firmwareFilename = new URL(latestFirmwareUrl).pathname.split('/').pop();

export function FirmwareUpgradeRequired(props: IFirmwareUpgradeRequiredProps) {
  return (
    <Paper sx={{ padding: 1, backgroundColor: 'warning.light' }}>
      <Paper sx={{ padding: 2 }} elevation={0}>
        <Typography component="h2" variant="h5" marginBottom={2}>
          Firmware upgrade required!
        </Typography>
        <Typography variant="body2" color="text.secondary" marginBottom={1}>
          Your Tiny Tapeout board requires a firmware upgrade to use this application.
        </Typography>
        <Typography variant="body2" marginBottom={1}>
          <strong>Important:</strong> the firmware upgrade will <strong>erase</strong> any existing
          data on the board, including modifications to config.ini and any saved files.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Upgrade instructions:
        </Typography>

        <List sx={{ listStyle: 'decimal', pl: 4 }}>
          <ListItem sx={{ display: '' }}>
            <ListItemText>
              Download the latest firmware:{' '}
              <a href={latestFirmwareUrl} target="_blank">
                {firmwareFilename}
              </a>
              .
            </ListItemText>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText>
              Click the following button:
              <Box marginTop={1}>
                <Button
                  onClick={() => props.device?.bootloader()}
                  variant="contained"
                  disabled={props.device == null}
                >
                  Reset to Bootloader
                </Button>
              </Box>
            </ListItemText>
          </ListItem>
          <ListItem sx={{ display: 'list-item' }}>
            <ListItemText>
              You'll see a new drive labeled <strong>RPI-RP2</strong> appear on your computer. Copy
              the firmware file to the 'RPI-RP2' drive.
            </ListItemText>
          </ListItem>
        </List>
        <Typography variant="body2" color="text.secondary">
          After the board reboots, you can reconnect to the board and continue using this
          application.
        </Typography>
      </Paper>
    </Paper>
  );
}
