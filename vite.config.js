import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
var defaultRepoName = 'groovaly-module-builder';
var githubRepository = process.env.GITHUB_REPOSITORY || '';
var repoName = githubRepository.includes('/')
    ? githubRepository.split('/')[1]
    : defaultRepoName;
export default defineConfig({
    plugins: [react()],
    base: process.env.GITHUB_ACTIONS ? "/".concat(repoName, "/") : '/',
    server: {
        proxy: {
            '/api': 'http://127.0.0.1:8000',
        },
    },
    test: {
        globals: true,
        environment: 'node',
    },
});
