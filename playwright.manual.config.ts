import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Config for manual Didaxis cleanup only. Do not use for normal test runs.
 */
export default defineConfig({
  testDir: path.resolve(__dirname, 'scripts/manual'),
  testMatch: 'cleanup.programs.spec.ts',
  timeout: 600_000,
  workers: 1,
  retries: 0,
  reporter: 'line',
  projects: [
    {
      name: 'manual-cleanup',
      use: {},
    },
  ],
});
