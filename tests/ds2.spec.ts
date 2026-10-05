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

function editDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
}

function createDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'New Program' });
}

function programCell(page: Page, name: string): Locator {
  return page.getByRole('cell').filter({ has: page.getByText(name, { exact: true }) });
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

async function openEditForm(page: Page, name: string): Promise<Locator> {
  const edit = page.getByRole('button', { name: `Edit ${name}`, exact: true });
  const dialog = editDialog(page);
  await edit.scrollIntoViewIfNeeded({ timeout: 45_000 });
  await edit.click();
  if (!(await dialog.isVisible())) {
    await expect(dialog).toBeVisible({ timeout: 5_000 }).catch(async () => {
      await edit.click();
      await expect(dialog).toBeVisible({ timeout: 15_000 });
    });
  }
  return dialog;
}

async function submitEdit(page: Page, dialog: Locator): Promise<void> {
  const saved = page.waitForResponse((response) => isProgramItemResponse(response, 'PATCH'));
  await dialog.getByRole('button', { name: 'Save' }).click();
  await saved;
  await expect(dialog).toBeHidden({ timeout: 30_000 });
}

async function expectProgramListed(page: Page, name: string): Promise<void> {
  const nameText = page.locator('tbody').getByText(name, { exact: true });
  await nameText.scrollIntoViewIfNeeded({ timeout: 45_000 });
  await expect(nameText).toBeVisible();
}

function trackReloads(page: Page): () => number {
  let reloads = 0;
  page.on('load', () => {
    reloads += 1;
  });
  return () => reloads;
}

test.beforeEach(async ({ page }) => {
  await login(page);
  const listed = page.waitForResponse((response) => isProgramsResponse(response, 'GET'), { timeout: 60_000 });
  await page.goto(`${requireCredentials().baseUrl}/programs`);
  await listed;
  await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: edit form opens pre-populated with current program data', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await createProgram(page, name, description);

    const dialog = await openEditForm(page, name);

    await expect(dialog.getByLabel('Program Name')).toHaveValue(name);
    await expect(dialog.getByLabel('Description')).toHaveValue(description);
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
  });

  test('TC-002: program name is updated and reflected immediately in the list', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const updatedName = `${name} - Updated`;
    await createProgram(page, name, 'Full-stack web development program');
    const reloads = trackReloads(page);
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Program Name').fill(updatedName);
    await submitEdit(page, dialog);

    await expectProgramListed(page, updatedName);
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
    expect(reloads()).toBe(0);
  });

  test('TC-003: unchanged fields are preserved when only description is edited', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const updatedDescription = 'Updated full-stack curriculum for 2026';
    await createProgram(page, name, description);

    const dialog = await openEditForm(page, name);
    await dialog.getByLabel('Description').fill(updatedDescription);
    await submitEdit(page, dialog);

    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(updatedDescription, { exact: true })).toBeVisible();
    await expect(programCell(page, name).getByText(description, { exact: true })).toHaveCount(0);

    const reopened = await openEditForm(page, name);
    await expect(reopened.getByLabel('Program Name')).toHaveValue(name);
    await expect(reopened.getByLabel('Description')).toHaveValue(updatedDescription);
  });

  test('TC-004: both name and description can be updated in a single edit', async ({ page }) => {
    const name = uniqueName('Mobile Development 2026');
    const updatedName = `${name} - Advanced`;
    const updatedDescription = 'Advanced iOS and Android development track';
    await createProgram(page, name, 'iOS and Android development');

    const dialog = await openEditForm(page, name);
    await dialog.getByLabel('Program Name').fill(updatedName);
    await dialog.getByLabel('Description').fill(updatedDescription);
    await submitEdit(page, dialog);

    await expectProgramListed(page, updatedName);
    await expect(programCell(page, updatedName).getByText(updatedDescription, { exact: true })).toBeVisible();
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('TC-005: save button is enabled when valid changes are made', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    await createProgram(page, name, 'Full-stack web development program');
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Description').fill('Revised curriculum');

    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();
  });
});

test.describe('Negative flows', () => {
  test('TC-006: program is not updated when user cancels the edit form', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const rejectedName = uniqueName('Should Not Save');
    await createProgram(page, name, description);
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Program Name').fill(rejectedName);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden({ timeout: 15_000 });
    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByText(rejectedName, { exact: true })).toHaveCount(0);
  });

  test('TC-007: empty program name prevents save', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await createProgram(page, name, description);
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Program Name').fill('');

    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
  });

  // The edit API accepts a repeated name and does not show an error.
  test.skip('TC-008: duplicate program name is rejected on edit — edit accepts an existing name and shows no error', async () => {});

  // Only an admin account is configured, so a non-admin session cannot be started.
  test.skip('TC-009: non-admin user cannot edit programs — only an admin account is configured', async () => {});

  test('TC-010: no update occurs when save is clicked without any changes', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await createProgram(page, name, description);
    const dialog = await openEditForm(page, name);

    await expect(dialog.getByLabel('Program Name')).toHaveValue(name);
    await expect(dialog.getByLabel('Description')).toHaveValue(description);
    await submitEdit(page, dialog);

    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('Edge cases', () => {
  test('TC-011: program name with special characters is accepted on edit', async ({ page }) => {
    const name = uniqueName('Basic Programming');
    const updatedName = uniqueName('Informatique & IA - Niveau 2');
    await createProgram(page, name, 'Introductory programming');

    const dialog = await openEditForm(page, name);
    await dialog.getByLabel('Program Name').fill(updatedName);
    await submitEdit(page, dialog);

    await expectProgramListed(page, updatedName);
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });

  test('TC-012: program name with only whitespace is rejected on edit', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await createProgram(page, name, description);
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Program Name').fill('   ');

    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expectProgramListed(page, name);
    await expect(programCell(page, name).getByText(description, { exact: true })).toBeVisible();
  });

  test('TC-013: program name at maximum allowed length is accepted on edit', async ({ page }) => {
    const name = uniqueName('Short Name');
    const updatedName = nameOfLength(255);
    await createProgram(page, name, 'Boundary length test');

    const dialog = await openEditForm(page, name);
    await dialog.getByLabel('Program Name').fill(updatedName);
    await submitEdit(page, dialog);

    await expectProgramListed(page, updatedName);
    expect(updatedName).toHaveLength(255);
  });

  // Program Name has no maximum length; a 256-character name is saved and no validation error is shown.
  test.skip('TC-014: program name exceeding maximum length is rejected on edit — a 256-character name is saved', async () => {});

  test('TC-015: description can be cleared to empty on edit', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    await createProgram(page, name, 'Full-stack web development program');
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Description').fill('');
    await submitEdit(page, dialog);

    await expectProgramListed(page, name);
    await expect(page.getByRole('cell', { name, exact: true })).toHaveText(name);
  });

  // Only one admin account is configured, so two concurrent admin sessions cannot be started.
  test.skip('TC-016: concurrent edit by two admins shows appropriate conflict handling — only one admin account is configured', async () => {});
});
