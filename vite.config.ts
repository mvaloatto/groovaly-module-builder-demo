import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const repoName = 'groovaly-module-builder';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? `/${repoName}/` : '/',
  test: {
    globals: true,
    environment: 'node',
  },
});
