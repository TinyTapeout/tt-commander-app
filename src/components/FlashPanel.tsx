import { Button, Stack, TextField, Typography } from '@suid/material';
import { createSignal, onMount, Show } from 'solid-js';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import ttFlash from '~/ttcontrol/ttflash.py?raw';

export interface IReplPanelProps {
  device: TTBoardDevice;
}

export function FlashPanel(props: IReplPanelProps) {
  let fileInput: HTMLInputElement | undefined;
  const [flashOffset, setFlashOffset] = createSignal(0);
  const [programming, setProgramming] = createSignal(false);
  const [programSize, setProgmamSize] = createSignal(0);
  const [flashWritten, setFlashWritten] = createSignal(0);

  onMount(() => {
    const { abort, signal } = new AbortController();
    props.device.addEventListener(
      'line',
      (e) => {
        const line = (e as CustomEvent<string>).detail.trim();
        if (line.startsWith('flash_prog=')) {
          const value = line.slice(11);
          if (value === 'ok') {
            setProgramming(false);
            return;
          }

          const lastAddress = parseInt(value, 16);
          setFlashWritten(lastAddress - flashOffset());
        }
      },
      { signal },
    );
    return () => abort();
  });

  const doFlash = async () => {
    const file = fileInput?.files?.[0];
    if (!file) {
      alert('No file selected');
      return;
    }

    const flashIdPromise = new Promise((resolve) => {
      const { signal, abort } = new AbortController();
      props.device.addEventListener(
        'line',
        (e) => {
          const line = (e as CustomEvent<string>).detail;
          if (line.startsWith('flash_id=')) {
            resolve(line);
            abort();
          }
        },
        { signal },
      );
    });
    await props.device.sendCommand(ttFlash, false);
    await flashIdPromise;
    const sectorSize = 4096;
    const fileData = new Uint8Array(await file.arrayBuffer());
    setProgmamSize(fileData.length);
    setProgramming(true);
    const startOffset = `0x${flashOffset().toString(16)}`;
    await props.device.sendCommand(`flash.program_sectors(${startOffset})`);
    // Wait 1 second for the python code to disable CTRL+C
    await new Promise((resolve) => setTimeout(resolve, 1000));
    for (let i = 0; i < fileData.length; i += sectorSize) {
      // measured transport speed: 92kb/sec
      const sectorData = fileData.slice(i, i + sectorSize);
      await props.device.writeBinary(new TextEncoder().encode(`${sectorData.length}\r\n`));
      await props.device.writeBinary(sectorData);
    }
    await props.device.writeBinary(new TextEncoder().encode(`0\r\n`));
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
      <Show when={programming()}>
        <Typography>
          Progress: {flashWritten()} / {programSize()} bytes
        </Typography>
      </Show>
    </Stack>
  );
}
