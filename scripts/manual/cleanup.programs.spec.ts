import { test } from '@playwright/test';
import { parseManualDeleteCount, runManualProgramCleanup } from './cleanup-logic';

/**
 * Manual-only Didaxis program cleanup. Not part of `npm test`.
 * Run: npm run cleanup:programs -- --count=10
 */
test.describe('Manual Didaxis program cleanup @manual', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(() => {
    if (process.env.MANUAL_DIDAXIS_CLEANUP !== '1') {
      throw new Error(
        'This utility does not run with the normal test suite. Use: npm run cleanup:programs -- --count=<N>',
      );
    }
  });

  test('DELETE requested programs via API', async () => {
    const count = parseManualDeleteCount(process.env.CLEANUP_COUNT);
    await runManualProgramCleanup(count);
  });
});
