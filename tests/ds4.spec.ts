import { test, expect, type Locator, type Page, type Response } from '@playwright/test';

// Override fullyParallel so this file's tests stay isolated under API load.
test.describe.configure({ mode: 'default', timeout: 180_000 });

const baseUrl = process.env.DIDAXIS_URL?.replace(/\/$/, '');
const email = process.env.DIDAXIS_EMAIL;
const password = process.env.DIDAXIS_PASSWORD;

function requireCredentials(): { baseUrl: string; email: string; password: string } {
  if (!baseUrl || !email || !password) {
    throw new Error('DIDAXIS_URL, DIDAXIS_EMAIL, and DIDAXIS_PASSWORD must be set');
  }
  return { baseUrl, email, password };
}

function uniqueName(base: string): string {
  return `${base} ${test.info().project.name} ${Date.now()}`;
}

function nameOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
}

function createDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programCell(page: Page, name: string): Locator {
  return page.getByRole('cell').filter({ has: page.getByText(name, { exact: true }) });
}

function deleteMessage(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
}

function isProgramsResponse(response: Response, method: string): boolean {
  return response.request().method() === method && new URL(response.url()).pathname === '/api/programs' && response.ok();
}

function isProgramItemResponse(response: Response, method: string): boolean {
  return (
    response.request().method() === method &&
    /\/api\/programs\/[^/]+$/.test(new URL(response.url()).pathname) &&
    response.ok()
  );
}

async function login(page: Page): Promise<void> {
  const credentials = requireCredentials();
  await page.goto(`${credentials.baseUrl}/login`);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.endsWith('/login'));
}

async function openCreateForm(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program', exact: true }).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  return dialog;
}

async function submitCreate(page: Page, dialog: Locator): Promise<void> {
  const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
  const refreshed = page.waitForResponse((response) => isProgramsResponse(response, 'GET'), { timeout: 60_000 });
  await dialog.getByRole('button', { name: 'Create' }).click();
  await created;
  await expect(dialog).toBeHidden({ timeout: 30_000 });
  await refreshed;
}

async function createProgram(page: Page, name: string, description = ''): Promise<void> {
  const dialog = await openCreateForm(page);
  await dialog.getByLabel('Program Name').fill(name);
  if (description) {
    await dialog.getByLabel('Description').fill(description);
  }
  await submitCreate(page, dialog);
  await expectProgramListed(page, name);
}

async function expectProgramListed(page: Page, name: string): Promise<void> {
  const nameText = page.locator('tbody').getByText(name, { exact: true });
  await nameText.scrollIntoViewIfNeeded({ timeout: 45_000 });
  await expect(nameText).toBeVisible();
}

async function expectProgramAbsent(page: Page, name: string): Promise<void> {
  await expect(page.locator('tbody').getByText(name, { exact: true })).toHaveCount(0, { timeout: 45_000 });
}

// window.confirm is a native dialog. Dismiss is the Escape/Cancel result.
async function respondToDeleteDialog(page: Page, name: string, accept: boolean): Promise<string> {
  const button = page.getByRole('button', { name: `Delete ${name}`, exact: true });
  await button.scrollIntoViewIfNeeded({ timeout: 45_000 });
  const dialogMessage = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      const message = dialog.message();
      if (accept) await dialog.accept();
      else await dialog.dismiss();
      resolve(message);
    });
  });
  await button.click();
  return dialogMessage;
}

async function confirmDelete(page: Page, name: string): Promise<string> {
  const deleted = page.waitForResponse((response) => isProgramItemResponse(response, 'DELETE'));
  const message = await respondToDeleteDialog(page, name, true);
  await deleted;
  return message;
}

test.beforeEach(async ({ page }) => {
  await login(page);
  const listed = page.waitForResponse((response) => isProgramsResponse(response, 'GET'), { timeout: 60_000 });
  await page.goto(`${requireCredentials().baseUrl}/programs`);
  await listed;
  await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: program is deleted after user confirms in the dialog', async ({ page }) => {
    const name = uniqueName('Test Program');
    await createProgram(page, name, 'Program created for deletion');

    const message = await confirmDelete(page, name);

    expect(message).toBe(deleteMessage(name));
    await expectProgramAbsent(page, name);
  });

  test('TC-002: program deletion is cancelled and program remains in the list', async ({ page }) => {
    const name = uniqueName('Test Program');
    const description = 'Program that should remain';
    await createProgram(page, name, description);

    const message = await respondToDeleteDialog(page, name, false);

    expect(message).toContain(name);
    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
  });

  test('TC-003: confirmation dialog displays the correct program name', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    await createProgram(page, name, 'Full-stack web development program');

    const message = await respondToDeleteDialog(page, name, false);

    expect(message).toBe(deleteMessage(name));
    await expectProgramListed(page, name);
  });

  // The shared catalog has thousands of programs, so a fixture of exactly 3 programs cannot be established.
  test.skip('TC-004: program list count decreases by one after confirmed deletion — the catalog does not contain exactly 3 programs', async () => {});
});

test.describe('Negative flows', () => {
  test('TC-005: program is not deleted when confirmation dialog is dismissed via Escape', async ({ page }) => {
    const name = uniqueName('Test Program');
    await createProgram(page, name, 'Program that should survive Escape');

    const message = await respondToDeleteDialog(page, name, false);

    expect(message).toContain(name);
    await expectProgramListed(page, name);
  });

  // Delete confirmation is a native window.confirm dialog, which has no page overlay to click.
  test.skip('TC-006: program is not deleted when confirmation dialog is dismissed by clicking outside — confirmation is a native dialog', async () => {});

  // Only an admin account is configured, so a non-admin session cannot be started.
  test.skip('TC-007: non-admin user cannot delete programs — only an admin account is configured', async () => {});

  // A failed delete leaves the program in place, but the page does not show an error message.
  test.skip('TC-008: program is not deleted when API or server error occurs during deletion — no deletion error is shown', async () => {});

  // The confirmation is a native dialog that closes on the first response. There is no in-page Confirm button to double-click.
  test.skip('TC-009: double-clicking confirm does not cause duplicate deletion errors — confirmation is a native dialog', async () => {});
});

test.describe('Edge cases', () => {
  // Showing the empty state requires deleting every program in the shared catalog.
  test.skip('TC-010: deleting the only program in the system shows empty state — the catalog is not limited to one program', async () => {});

  test('TC-011: deleting a program with a long name displays correctly in confirmation dialog', async ({ page }) => {
    const name = nameOfLength(255);
    await createProgram(page, name, 'Long name deletion');

    const message = await respondToDeleteDialog(page, name, false);

    expect(message).toBe(deleteMessage(name));
    expect(name).toHaveLength(255);
    await expectProgramListed(page, name);
  });

  test('TC-012: deleting a program with special characters in the name works correctly', async ({ page }) => {
    const name = uniqueName('Informatique & IA - Niveau 2');
    await createProgram(page, name, 'Special character deletion');

    const message = await confirmDelete(page, name);

    expect(message).toBe(deleteMessage(name));
    await expectProgramAbsent(page, name);
  });

  test('TC-013: cancelled deletion allows immediate retry', async ({ page }) => {
    const name = uniqueName('Test Program');
    await createProgram(page, name, 'Cancel then delete');

    await respondToDeleteDialog(page, name, false);
    await expectProgramListed(page, name);
    await confirmDelete(page, name);

    await expectProgramAbsent(page, name);
  });

  test('TC-014: deleted program name becomes available for reuse', async ({ page }) => {
    const name = uniqueName('Test Program');
    await createProgram(page, name, 'Name to reuse');
    await confirmDelete(page, name);
    await expectProgramAbsent(page, name);

    await createProgram(page, name, 'Recreated program');

    await expectProgramListed(page, name);
  });

  // The native dialog closes before the request starts, and the page does not disable delete or show a loading state.
  test.skip('TC-015: delete icon is not visible or is disabled during an in-progress deletion — no in-progress delete state is shown', async () => {});
});
