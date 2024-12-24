import { Button, Stack, TextField, Typography } from '@suid/material';
import { createSignal } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import ttFlash from '~/ttcontrol/ttflash.py?raw';

export interface IReplPanelProps {
  device: TTBoardDevice;
}

export function FlashPanel(props: IReplPanelProps) {
  let fileInput: HTMLInputElement | undefined;
  const [flashOffset, setFlashOffset] = createSignal(0);

  const doFlash = async () => {
    const file = fileInput?.files?.[0];
    if (!file) {
      alert('No file selected');
      return;
    }

    const flashIdPromise = new Promise((resolve) => {
      props.device.addEventListener('line', (e) => {
        const line = (e as CustomEvent<string>).detail;
        if (line.startsWith('flash_id=')) {
          resolve(line);
        }
      });
    });
    await props.device.sendCommand(ttFlash, false);
    await flashIdPromise;
    const sectorSize = 4096;
    const fileData = new Uint8Array(await file.arrayBuffer());
    for (let i = 0; i < fileData.length; i += sectorSize) {
      const sectorData = fileData.slice(i, i + sectorSize);
      const startOffset = `0x${(flashOffset() + i).toString(16)}`;
      await props.device.sendCommand(`flash.erase_sector(${startOffset})`);

      for (let page = 0; page < sectorData.length; page += 256) {
        const chunk = sectorData.slice(page, page + 256);
        const chunkBase64 = btoa(String.fromCharCode(...chunk));

        const programPromise = new Promise((resolve) => {
          props.device.addEventListener('line', (e) => {
            const line = (e as CustomEvent<string>).detail;
            if (line.startsWith('flash_prog=')) {
              resolve(line);
            }
          });
        });
        const progOffset = `0x${(flashOffset() + i + page).toString(16)}`;
        await props.device.sendCommand(`flash.program_base64(${progOffset}, "${chunkBase64}")`);
        await programPromise;
      }
    }
  };

  return (
    <Stack>
      <Typography>
        File to flash: <input type="file" ref={fileInput} />
      </Typography>
      <Typography>
        <TextField
          sx={{ maxWidth: 120 }}
          label="Flash offset"
          type="number"
          size="small"
          value={flashOffset()}
          InputProps={{ inputProps: { min: 0, max: 16 * 1024 * 1024 } }}
          fullWidth
          onChange={(e) => {
            setFlashOffset((e.target as HTMLInputElement).valueAsNumber);
          }}
        />
      </Typography>
      <Button variant="contained" onClick={doFlash}>
        Flash
      </Button>
    </Stack>
  );
}
