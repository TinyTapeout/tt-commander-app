import suidPlugin from '@suid/vite-plugin';
import child from 'child_process';
import path from 'path';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const commitHash = child.execSync('git rev-parse --short HEAD').toString();

export default defineConfig({
  plugins: [suidPlugin(), solidPlugin()],

  server: {
    open: true,
  },

  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'), // <---- add this
    },
  },

  define: {
    __COMMIT_HASH__: JSON.stringify(commitHash.trim()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
});
