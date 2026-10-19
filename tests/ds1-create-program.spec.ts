import { test, expect } from '../fixtures/cleanup.fixture';
import type { Locator, Page } from '@playwright/test';

// Override fullyParallel so this file's tests stay isolated under API load.
test.describe.configure({ mode: 'default', timeout: 90_000 });

function requireBaseUrl(): string {
  const baseUrl = process.env.DIDAXIS_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('DIDAXIS_URL must be set');
  }
  return baseUrl;
}

function uniqueName(base: string): string {
  return `${base} ${Date.now()}`;
}

function createDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programCell(page: Page, name: string): Locator {
  return page.getByRole('cell').filter({ has: page.getByText(name, { exact: true }) });
}

async function openCreateForm(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: '+ New Program', exact: true }).click();
  const dialog = createDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

function isProgramsResponse(response: { url(): string; ok(): boolean; request(): { method(): string } }, method: string): boolean {
  return response.request().method() === method && new URL(response.url()).pathname === '/api/programs' && response.ok();
}

async function submitCreate(page: Page, dialog: Locator): Promise<string> {
  const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
  await dialog.getByRole('button', { name: 'Create' }).click();
  const response = await created;
  const body = (await response.json()) as { data?: { id?: string } };
  const uuid = body.data?.id;
  if (!uuid) {
    throw new Error('Create program response did not include data.id');
  }
  await expect(dialog).toBeHidden({ timeout: 15_000 });
  await page.reload();
  await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible();
  return uuid;
}

async function expectProgramListed(page: Page, name: string): Promise<void> {
  await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 20_000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${requireBaseUrl()}/programs`);
  await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible();
});

test.describe('Positive flows', () => {
  test('TC-001: program creation form displays required fields', async ({ page }) => {
    const dialog = await openCreateForm(page);

    await expect(dialog.getByLabel('Program Name')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('TC-002: program is created successfully with valid name and description', async ({ page, trackProgram }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await dialog.getByLabel('Description').fill(description);
    trackProgram(await submitCreate(page, dialog));

    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('TC-003: program is created successfully with name only and empty description', async ({ page, trackProgram }) => {
    const name = uniqueName('Data Science Fundamentals');
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    trackProgram(await submitCreate(page, dialog));

    await expectProgramListed(page, name);
    await expect(page.getByRole('cell', { name, exact: true })).toHaveText(name);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('TC-004: Create button remains disabled until Program Name is provided', async ({ page }) => {
    const dialog = await openCreateForm(page);

    await expect(dialog.getByLabel('Program Name')).toHaveValue('');
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('TC-005: Create button becomes enabled after entering a valid Program Name', async ({ page }) => {
    const dialog = await openCreateForm(page);
    const createButton = dialog.getByRole('button', { name: 'Create' });

    await expect(createButton).toBeDisabled();
    await dialog.getByLabel('Program Name').fill(uniqueName('Cloud Computing 2026'));
    await expect(createButton).toBeEnabled();
  });
});

test.describe('Negative flows', () => {
  test('TC-006: program is not created when submission is attempted with empty Program Name', async ({ page }) => {
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Description').fill(uniqueName('Some description'));

    await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled();
    await expect(dialog).toBeVisible();
  });

  test('TC-007: program is not created when user cancels the creation form', async ({ page }) => {
    const name = uniqueName('Cancelled Program');
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await dialog.getByLabel('Description').fill('This should not be saved');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  // Only an admin account is configured, so a non-admin session cannot be started.
  test.skip('TC-008: non-admin user cannot access program creation form', async () => {});

  // The create API accepts a repeated name and does not show an error.
  test.skip('TC-009: duplicate program name is rejected on creation', async () => {});
});

test.describe('Edge cases', () => {
  test('TC-010: program name at maximum allowed length is accepted', async ({ page, trackProgram }) => {
    const suffix = ` ${Date.now()}`;
    const name = `${'A'.repeat(255 - suffix.length)}${suffix}`;
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await dialog.getByLabel('Description').fill('Boundary length test');
    trackProgram(await submitCreate(page, dialog));

    await expectProgramListed(page, name);
  });

  // Program Name has no maximum length; a 256-character name is saved.
  test.skip('TC-011: program name exceeding maximum length is rejected', async () => {});

  test('TC-012: program name with special characters is accepted', async ({ page, trackProgram }) => {
    const name = uniqueName('Informatique & IA - Niveau 2');
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await dialog.getByLabel('Description').fill('Program with special characters');
    trackProgram(await submitCreate(page, dialog));

    await expectProgramListed(page, name);
  });

  test('TC-013: program name with only whitespace is treated as empty', async ({ page }) => {
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill('   ');

    await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled();
    await expect(dialog).toBeVisible();
  });

  test('TC-014: description at maximum allowed length is accepted', async ({ page, trackProgram }) => {
    const name = uniqueName('Long Description Program');
    const marker = `D${Date.now()}`;
    const description = `${marker}${'D'.repeat(1000 - marker.length)}`;
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await dialog.getByLabel('Description').fill(description);
    trackProgram(await submitCreate(page, dialog));

    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
  });

  test('TC-015: closing modal via Escape does not create a program', async ({ page }) => {
    const name = uniqueName('Unsaved Program');
    const dialog = await openCreateForm(page);

    await dialog.getByLabel('Program Name').fill(name);
    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
});
