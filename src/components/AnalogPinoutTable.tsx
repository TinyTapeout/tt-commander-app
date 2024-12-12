// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Table, TableBody, TableCell, TableHead, TableRow } from '@suid/material';
import { For } from 'solid-js';

export interface IAnalogPinoutProps {
  pinout: Record<string, string>;
  analogPins: number[];
}

export function AnalogPinoutTable(props: IAnalogPinoutProps) {
  const breakoutPin = (analog: number) => {
    return analog < 6 ? 'A' + analog : 'B' + (analog - 6);
  };

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <code>ua</code>
          </TableCell>
          <TableCell>PCB Pin</TableCell>
          <TableCell>Internal index</TableCell>
          <TableCell>Description</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <For each={Array.from(props.analogPins.entries())}>
          {([ua, analog]) => (
            <TableRow>
              <TableCell>{ua}</TableCell>
              <TableCell>{breakoutPin(analog)}</TableCell>
              <TableCell>{analog}</TableCell>
              <TableCell>{props.pinout[`ua[${ua}]`]}</TableCell>
            </TableRow>
          )}
        </For>
      </TableBody>
    </Table>
  );
}
