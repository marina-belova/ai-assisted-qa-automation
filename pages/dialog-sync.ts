import type { Page } from '@playwright/test';

/** Wait until no modal dialog is open (including closing animations / overlays on WebKit). */
export async function waitUntilDialogsClosed(page: Page, timeout = 30_000): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('[role="dialog"][aria-modal="true"]').length === 0,
    undefined,
    { timeout },
  );
}
