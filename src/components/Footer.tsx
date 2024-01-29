// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2024, Tiny Tapeout LTD

import { Box, Typography } from '@suid/material';

export function Footer() {
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
        Copyright (C) 2024, Tiny Tapeout LTD. Revision <code>{__COMMIT_HASH__}</code> built at{' '}
        {buildTimeShort}.
      </Typography>
    </Box>
  );
}
