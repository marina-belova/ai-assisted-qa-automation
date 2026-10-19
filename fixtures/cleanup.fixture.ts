import { test as base, expect } from '@playwright/test';
import {
  captureTokenFromLogin,
  deleteProgram,
  tokenForCleanup,
} from './didaxis-auth';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use) => {
    const ids: string[] = [];
    await use((uuid) => {
      ids.push(uuid);
    });
    if (ids.length === 0) return;

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
  },
});

export { expect };
