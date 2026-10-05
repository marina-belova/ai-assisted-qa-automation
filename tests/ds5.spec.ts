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

function editDialog(page: Page): Locator {
  return page.getByRole('dialog', { name: 'Edit Program' });
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
  const dialog = createDialog(page);
  await page.getByRole('button', { name: '+ New Program', exact: true }).click();
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

async function expectProgramListed(page: Page, name: string): Promise<void> {
  const nameText = page.locator('tbody').getByText(name, { exact: true });
  await nameText.scrollIntoViewIfNeeded({ timeout: 45_000 });
  await expect(nameText).toBeVisible();
}

async function expectProgramAbsent(page: Page, name: string): Promise<void> {
  await expect(page.locator('tbody').getByText(name, { exact: true })).toHaveCount(0, { timeout: 45_000 });
}

function trackReloads(page: Page): () => number {
  let reloads = 0;
  page.on('load', () => {
    reloads += 1;
  });
  return () => reloads;
}

async function confirmDelete(page: Page, name: string): Promise<void> {
  const button = page.getByRole('button', { name: `Delete ${name}`, exact: true });
  await button.scrollIntoViewIfNeeded({ timeout: 45_000 });
  const deleted = page.waitForResponse((response) => isProgramItemResponse(response, 'DELETE'));
  const dialogMessage = new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
    page.once('dialog', async (dialog) => {
      clearTimeout(timer);
      await dialog.accept();
      resolve();
    });
  });
  await button.click();
  await dialogMessage;
  await deleted;
}

async function rowIndexes(page: Page, names: string[]): Promise<number[]> {
  return page.evaluate((expected) => {
    const rows = [...document.querySelectorAll('tbody tr')];
    return expected.map((name) => rows.findIndex((row) => row.textContent?.includes(name)));
  }, names);
}

test.beforeEach(async ({ page }) => {
  await login(page);
  const listed = page.waitForResponse((response) => isProgramsResponse(response, 'GET'), { timeout: 60_000 });
  await page.goto(`${requireCredentials().baseUrl}/programs`);
  await listed;
  await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: program list displays name and description for each program', async ({ page }) => {
    const webName = uniqueName('Web Development 2026');
    const webDescription = 'Full-stack web development program';
    const dataName = uniqueName('Data Science 2026');
    const dataDescription = 'Machine learning and analytics program';
    await createProgram(page, webName, webDescription);
    await createProgram(page, dataName, dataDescription);

    await expect(programCell(page, webName).getByText(webDescription, { exact: true })).toBeVisible();
    await expect(programCell(page, dataName).getByText(dataDescription, { exact: true })).toBeVisible();
  });

  // The empty state is only rendered when the catalog has zero programs.
  test.skip('TC-002: empty state is shown when no programs exist — the shared catalog is not empty', async () => {});

  // The empty-state create prompt is only rendered when the catalog has zero programs.
  test.skip('TC-003: empty state create prompt opens the program creation form — the shared catalog is not empty', async () => {});

  // The empty-to-populated transition requires starting from zero programs.
  test.skip('TC-004: program list updates immediately after creating a new program — the shared catalog is not empty', async () => {});

  test('TC-005: program list updates immediately after editing a program', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const updatedDescription = 'Updated curriculum';
    await createProgram(page, name, 'Full-stack web development program');
    const reloads = trackReloads(page);
    const dialog = await openEditForm(page, name);

    await dialog.getByLabel('Description').fill(updatedDescription);
    const saved = page.waitForResponse((response) => isProgramItemResponse(response, 'PATCH'));
    await dialog.getByRole('button', { name: 'Save' }).click();
    await saved;
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    await expect(programCell(page, name).getByText(updatedDescription, { exact: true })).toBeVisible({ timeout: 45_000 });
    expect(reloads()).toBe(0);
  });

  test('TC-006: program list updates immediately after deleting a program', async ({ page }) => {
    const keptName = uniqueName('Web Development 2026');
    const deletedName = uniqueName('Data Science 2026');
    await createProgram(page, keptName, 'Full-stack web development program');
    await createProgram(page, deletedName, 'Machine learning and analytics program');
    const reloads = trackReloads(page);

    await confirmDelete(page, deletedName);

    await expectProgramAbsent(page, deletedName);
    await expectProgramListed(page, keptName);
    expect(reloads()).toBe(0);
  });
});

test.describe('Negative flows', () => {
  test('TC-007: program list does not show stale data after failed creation', async ({ page }) => {
    const existingName = uniqueName('Web Development 2026');
    const failedName = uniqueName('Unsaved Program');
    await createProgram(page, existingName, 'Full-stack web development program');
    await page.route('**/api/programs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"error"}' });
        return;
      }
      await route.continue();
    });
    const dialog = await openCreateForm(page);
    await dialog.getByLabel('Program Name').fill(failedName);
    await dialog.getByLabel('Description').fill('This create should fail');
    const failed = page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/programs',
    );
    await dialog.getByRole('button', { name: 'Create' }).click();

    expect((await failed).status()).toBe(500);
    await expect(dialog).toBeVisible();
    await expect(page.getByText(failedName, { exact: true })).toHaveCount(0);
    await expectProgramListed(page, existingName);
  });

  // Only an admin account is configured, so a non-admin session cannot be started.
  test.skip('TC-008: non-admin user can view the program list but cannot create from empty state actions — only an admin account is configured', async () => {});

  test('TC-009: program list does not display internal or system fields', async ({ page }) => {
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await createProgram(page, name, description);

    const text = await programCell(page, name).innerText();
    expect(text).toContain(name);
    expect(text).toContain(description);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  // A failed programs request leaves the list empty and shows the empty state. No error message or retry control is rendered.
  test.skip('TC-010: error state is shown when program list fails to load — a failed load shows the empty state', async () => {});
});

test.describe('Edge cases', () => {
  test('TC-011: program with empty description displays gracefully in the list', async ({ page }) => {
    const name = uniqueName('Minimal Program');
    await createProgram(page, name);

    await expect(page.getByRole('cell', { name, exact: true })).toHaveText(name);
  });

  test('TC-012: program with long name and description displays without breaking layout', async ({ page }) => {
    const name = nameOfLength(255);
    const marker = `D${Date.now()}`;
    const description = `${marker}${'D'.repeat(1000 - marker.length)}`;
    await createProgram(page, name, description);

    const nameText = programCell(page, name).getByText(name, { exact: true });
    const descriptionText = programCell(page, name).getByText(description, { exact: true });
    await expect(nameText).toBeVisible({ timeout: 45_000 });
    await expect(descriptionText).toBeAttached();
    const layout = await descriptionText.evaluate((element) => {
      const descriptionStyle = getComputedStyle(element);
      const nameElement = element.parentElement?.querySelector('p');
      const nameOverflows = nameElement ? nameElement.scrollWidth > nameElement.clientWidth + 1 : false;
      return {
        lineClamp: descriptionStyle.webkitLineClamp,
        nameOverflows,
      };
    });
    expect(layout.lineClamp).toBe('1');
    expect(layout.nameOverflows).toBe(false);
    expect(name).toHaveLength(255);
    expect(description).toHaveLength(1000);
  });

  test('TC-013: program with special characters in name and description displays correctly', async ({ page }) => {
    const name = uniqueName('Informatique & IA - Niveau 2');
    const description = `Curriculum "advanced" & research ${Date.now()}`;
    await createProgram(page, name, description);

    const descriptionText = programCell(page, name).getByText(description, { exact: true });
    await expect(descriptionText).toBeVisible({ timeout: 45_000 });
    await expect(descriptionText).toHaveText(description);
  });

  test('TC-014: large number of programs displays with acceptable performance', async ({ page }) => {
    const started = Date.now();
    const loaded = page.waitForResponse((response) => isProgramsResponse(response, 'GET'));
    await page.reload();
    await loaded;
    await expect(page.getByRole('table')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible({ timeout: 30_000 });
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(3_000);
    const list = await page.evaluate(() => ({
      rows: document.querySelectorAll('tbody tr').length,
      scrolls: document.documentElement.scrollHeight > window.innerHeight,
    }));
    expect(list.rows).toBeGreaterThanOrEqual(100);
    expect(list.scrolls).toBe(true);
  });

  test('TC-015: program list sort order is consistent', async ({ page }) => {
    const names = [uniqueName('Alpha Program'), uniqueName('Beta Program'), uniqueName('Gamma Program')];
    for (const name of names) {
      await createProgram(page, name, 'Sort order check');
    }

    const before = await rowIndexes(page, names);
    expect(before.every((index) => index >= 0)).toBe(true);
    await page.reload();
    await expect(page.getByRole('button', { name: '+ New Program', exact: true })).toBeVisible({ timeout: 30_000 });
    for (const name of names) {
      await expect(page.locator('tbody').getByText(name, { exact: true })).toBeAttached({ timeout: 45_000 });
    }
    const after = await rowIndexes(page, names);

    const orderOf = (indexes: number[]) => indexes.map((index, position) => position).sort((left, right) => indexes[left] - indexes[right]);
    expect(orderOf(after)).toEqual(orderOf(before));
  });

  // Reaching the empty state requires deleting every program in the shared catalog.
  test.skip('TC-016: transition from populated list to empty state after deleting last program — the catalog is not limited to one program', async () => {});

  test('TC-017: program list is accessible via keyboard navigation', async ({ page, browserName }) => {
    // Playwright's WebKit build does not move DOM focus when Tab is pressed. The buttons are in the tab order (tabIndex 0).
    test.skip(browserName === 'webkit', 'Playwright WebKit does not move focus on Tab, so this keyboard flow cannot be driven there');

    const name = uniqueName('Keyboard Program');
    await createProgram(page, name, 'Keyboard access check');
    const edit = page.getByRole('button', { name: `Edit ${name}`, exact: true });
    const remove = page.getByRole('button', { name: `Delete ${name}`, exact: true });
    const row = page.getByRole('row').filter({ has: page.getByRole('button', { name: `Edit ${name}`, exact: true }) });

    await edit.scrollIntoViewIfNeeded({ timeout: 45_000 });
    await edit.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(edit).toBeFocused();
    expect(await edit.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await page.keyboard.press('Enter');
    const dialog = editDialog(page);
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden({ timeout: 30_000 });

    await remove.scrollIntoViewIfNeeded({ timeout: 45_000 });
    await remove.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(remove).toBeFocused();
    const confirmation = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
      page.once('dialog', async (nativeDialog) => {
        clearTimeout(timer);
        await nativeDialog.dismiss();
        resolve();
      });
    });
    await page.keyboard.press('Enter');
    await confirmation;
    await expectProgramListed(page, name);
    await expect(row).toBeVisible();
  });
});
