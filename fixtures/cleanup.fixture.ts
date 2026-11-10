import { test as base, expect } from '@playwright/test';
import {
  captureTokenFromLogin,
  deleteProgram,
  tokenForCleanup,
} from './didaxis-auth';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
  untrackProgram: (uuid: string) => void;
};

// afterEach runs before this fixture's teardown. The map is still populated then.
const trackedIdsByTest = new Map<string, string[]>();

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use, testInfo) => {
    const ids: string[] = [];
    trackedIdsByTest.set(testInfo.testId, ids);
    try {
      await use((uuid) => {
        ids.push(uuid);
      });
    } finally {
      trackedIdsByTest.delete(testInfo.testId);
    }
  },

  untrackProgram: async ({}, use, testInfo) => {
    await use((uuid) => {
      const ids = trackedIdsByTest.get(testInfo.testId);
      if (!ids) return;
      const index = ids.indexOf(uuid);
      if (index >= 0) ids.splice(index, 1);
    });
  },
});

test.afterEach(async ({}, testInfo) => {
  const ids = trackedIdsByTest.get(testInfo.testId);
  if (!ids || ids.length === 0) return;

  let token = await tokenForCleanup();
  for (const id of ids) {
    let response = await deleteProgram(id, token);
    if (response.status === 401) {
      token = await captureTokenFromLogin();
      response = await deleteProgram(id, token);
    }
    if (!response.ok) {
      throw new Error(`Cleanup failed for ${id}: ${response.status}`);
    }
  }
});

export { expect };
