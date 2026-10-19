#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_COUNT = 300;
const countArg = process.argv.slice(2).find((arg) => arg.startsWith('--count='));

if (!countArg) {
  console.error('Usage: npm run cleanup:programs -- --count=<N>');
  console.error('Examples: npm run cleanup:programs -- --count=10');
  console.error('          npm run cleanup:programs -- --count=100');
  console.error('          npm run cleanup:programs -- --count=300');
  console.error(`N must be between 1 and ${MAX_COUNT}. There is no delete-all option.`);
  process.exit(1);
}

const count = parseInt(countArg.slice('--count='.length), 10);
if (!Number.isFinite(count) || count < 1 || count > MAX_COUNT) {
  console.error(`--count must be an integer from 1 to ${MAX_COUNT}.`);
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const config = path.join(root, 'playwright.manual.config.ts');

const result = spawnSync(
  'npx',
  ['playwright', 'test', '--config', config],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      MANUAL_DIDAXIS_CLEANUP: '1',
      CLEANUP_COUNT: String(count),
    },
  },
);

process.exit(result.status ?? 1);
