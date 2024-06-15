// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Box, Typography } from '@suid/material';
import { repo } from '~/config/consts';

export function Footer() {
  const commit = __COMMIT_HASH__;
  const buildTimeShort = __BUILD_TIME__.replace(/\.\d{3}/, '');

  return (
    <Box
      component="footer"
      sx={{
        py: 1,
        px: 2,
        mt: 4,
        width: '100%',
        textAlign: 'center',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[200] : theme.palette.grey[800],
      }}
    >
      <Typography variant="body2">
        Copyright (C) 2024, Tiny Tapeout LTD. Revision{' '}
        <a href={`${repo}/commit/${commit}`} target="_blank">
          <code>{commit}</code>
        </a>{' '}
        built at {buildTimeShort}.
      </Typography>
    </Box>
  );
}
