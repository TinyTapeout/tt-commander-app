// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

/// <reference types="dom-serial" />

import { Warning } from '@suid/icons-material';
import { CssBaseline, Paper, Stack, ThemeProvider, Typography } from '@suid/material';
import { Show, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { compareVersions, minimumFirmwareVersion } from '~/model/firmware';
import { TTBoardDevice } from '~/ttcontrol/TTBoardDevice';
import { theme } from '~/utils/theme';
import { BoardCommander } from './BoardCommander';
import { FirmwareUpgradeRequired } from './FirmwareUpgradeRequired';
import { Footer } from './Footer';
import { Header } from './Header';
import { LoadingButton } from './LoadingButton';

export function App() {
  const [supported, setSupported] = createSignal(false);
  const [breakoutDevice, setBreakoutDevice] = createSignal<TTBoardDevice | null>(null);
  const [connecting, setConnecting] = createSignal(false);
  const [connectError, setConnectError] = createSignal<Error | null>(null);
  const [firmwareUpdateRequired, setFirmwareUpdateRequired] = createSignal(false);
  const [unsupportedVersion, setUnsupportedVersion] = createSignal<string | null>(null);

  const connect = async () => {
    setConnecting(true);
    setUnsupportedVersion(null);
    try {
      const port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x2e8a, usbProductId: 0x0005 }],
      });
      await port.open({ baudRate: 115200 });
      const device = new TTBoardDevice(port);
      device.addEventListener('close', () => setBreakoutDevice(null));
      setBreakoutDevice(device);
      setFirmwareUpdateRequired(false);
      void device.start();
    } catch (e) {
      setConnectError(e as Error);
    } finally {
      setConnecting(false);
    }
  };

  onMount(() => {
    setSupported('serial' in navigator);
  });

  onCleanup(() => {
    breakoutDevice()?.close();
  });

  createEffect(() => {
    const device = breakoutDevice();
    if (device?.data.version) {
      let value = false;
      try {
        value = compareVersions(device.data.version, minimumFirmwareVersion) < 0;
      } catch (e) {
        setUnsupportedVersion(device.data.version);
      }
      setFirmwareUpdateRequired(value);
      if (value) {
        console.warn('Detected outdated firmware version:', device.data.version);
        console.warn('Minimum required version:', minimumFirmwareVersion);
      }
    }
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />

      <Stack component="main" maxWidth="100vw" minHeight="100vh" alignItems="center">
        <Header />

        <Stack maxWidth="100%" width={600} flex="1" py={2}>
          <Typography variant="h6" component="div">
            Configure your Tiny Tapeout Board
          </Typography>

          <Typography variant="body1" color="text.secondary" gutterBottom>
            For Tiny Tapeout boards with TT04 or a later chip.
          </Typography>

          <Show when={!supported()}>
            <Stack mt={2}>
              <Typography variant="body1" color="error">
                Your browser does not support the Web Serial API. You can use Chrome, Edge, or Opera
                to connect to the breakout board from this page.
              </Typography>
            </Stack>
          </Show>

          <Show when={supported() && !breakoutDevice()}>
            <Stack mt={2}>
              <LoadingButton onClick={connect} variant="contained" loading={connecting()}>
                Connect to Board
              </LoadingButton>
              <Show when={connectError()}>
                <Typography variant="body1" color="error">
                  Error: {connectError()?.message}
                </Typography>
              </Show>
            </Stack>
          </Show>

          <Show when={firmwareUpdateRequired()}>
            <Stack mt={2}>
              <FirmwareUpgradeRequired device={breakoutDevice() ?? undefined} />
            </Stack>
          </Show>

          <Show when={unsupportedVersion()}>
            <Paper sx={{ bgcolor: 'warning.light', padding: 2, marginTop: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Warning fontSize="large" />
                <Stack> Unsupported firmware version: {unsupportedVersion()}</Stack>
              </Stack>
            </Paper>
          </Show>

          <Show when={!firmwareUpdateRequired() && breakoutDevice()}>
            {(device) => <BoardCommander device={device()} />}
          </Show>
        </Stack>

        <Footer />
      </Stack>
    </ThemeProvider>
  );
}
