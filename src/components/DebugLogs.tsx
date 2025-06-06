// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD
// Author: Uri Shaked

import { List, ListItem } from '@suid/material';
import { For, createEffect } from 'solid-js';
import { ILogEntry } from '~/ttcontrol/TTBoardDevice';

export function DebugLogs(props: { logs: ILogEntry[] }) {
  let listRef: HTMLUListElement | null = null;

  createEffect(() => {
    if (listRef && props.logs.length > 0) {
      listRef.scrollTop = listRef.scrollHeight;
    }
  });

  return (
    <List
      dense
      ref={(el) => (listRef = el)}
      sx={{
        background: 'black',
        fontFamily: 'monospace',
        marginTop: 2,
        maxHeight: 400,
        overflow: 'auto',
      }}
    >
      <ListItem sx={{ color: '#ccc' }}>Debug log</ListItem>
      <For
        each={props.logs}
        children={(logEntry) => (
          <ListItem
            sx={{
              color: logEntry.sent ? '#ccffcc' : '#ffccff',
              paddingTop: 0,
              paddingBottom: 0,
            }}
          >
            {logEntry.sent ? '> ' : ''}
            {logEntry.text}
          </ListItem>
        )}
      />
    </List>
  );
}
