import { AppBar, Box, Button, IconButton, Toolbar, Typography } from '@suid/material';
import { repo } from '~/config/consts';
import { GitHubIcon } from './GitHubIcon';

export function Header() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div">
          Tiny Tapeout Commander
        </Typography>
        <Box
          sx={{
            background: '#b00000',
            color: 'white',
            padding: 1,
            marginLeft: 1.5,
            letterSpacing: 1.5,
          }}
        >
          LEGACY
        </Box>
        <Box flexGrow={1} />
        <Button color="inherit" href="https://www.tinytapeout.com/guides/get-started-demoboard/">
          Guide
        </Button>
        <IconButton
          color="inherit"
          component="a"
          href={repo}
          target="_blank"
          title="GitHub repository"
        >
          <GitHubIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
