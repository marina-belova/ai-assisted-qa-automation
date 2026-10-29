import { test, expect } from '../fixtures/cleanup.fixture';
import { EditProgramModal } from '../pages/EditProgramModal';
import { ProgramsPage } from '../pages/ProgramsPage';
import { isProgramsResponse } from '../pages/program-api';
import { nameOfLength, uniqueName } from '../utils/test-data';

// Override fullyParallel so this file's tests stay isolated under API load.
test.describe.configure({ mode: 'default', timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: program list displays name and description for each program', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const webName = uniqueName('Web Development 2026');
    const webDescription = 'Full-stack web development program';
    const dataName = uniqueName('Data Science 2026');
    const dataDescription = 'Machine learning and analytics program';

    const webCreated = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(webName, webDescription);
    const webBody = (await (await webCreated).json()) as { data?: { id?: string } };
    const webId = webBody.data?.id;
    if (!webId) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(webId);
    await programs.scrollProgramNameIntoView(webName);
    await expect(programs.programNameText(webName)).toBeVisible();

    const dataCreated = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(dataName, dataDescription);
    const dataBody = (await (await dataCreated).json()) as { data?: { id?: string } };
    const dataId = dataBody.data?.id;
    if (!dataId) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(dataId);
    await programs.scrollProgramNameIntoView(dataName);
    await expect(programs.programNameText(dataName)).toBeVisible();

    await expect(programs.textInProgramCell(webName, webDescription)).toBeVisible();
    await expect(programs.textInProgramCell(dataName, dataDescription)).toBeVisible();
  });

  test('TC-005: program list updates immediately after editing a program', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const updatedDescription = 'Updated curriculum';
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Full-stack web development program');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const reloads = programs.trackReloads();
    const modal = await programs.openEditProgram(name);

    await modal.fillDescription(updatedDescription);
    await modal.submitEdit();

    await expect(programs.textInProgramCell(name, updatedDescription)).toBeVisible({ timeout: 45_000 });
    expect(reloads()).toBe(0);
  });

  test('TC-006: program list updates immediately after deleting a program', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const keptName = uniqueName('Web Development 2026');
    const deletedName = uniqueName('Data Science 2026');
    const keptCreated = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(keptName, 'Full-stack web development program');
    const keptBody = (await (await keptCreated).json()) as { data?: { id?: string } };
    const keptId = keptBody.data?.id;
    if (!keptId) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(keptId);
    await programs.scrollProgramNameIntoView(keptName);
    await expect(programs.programNameText(keptName)).toBeVisible();
    await programs.createProgram(deletedName, 'Machine learning and analytics program');
    await programs.scrollProgramNameIntoView(deletedName);
    await expect(programs.programNameText(deletedName)).toBeVisible();
    const reloads = programs.trackReloads();

    await programs.confirmDeleteProgram(deletedName);

    await expect(programs.programNameText(deletedName)).toHaveCount(0, { timeout: 45_000 });
    await programs.scrollProgramNameIntoView(keptName);
    await expect(programs.programNameText(keptName)).toBeVisible();
    expect(reloads()).toBe(0);
  });
});

test.describe('Negative flows', () => {
  test('TC-007: program list does not show stale data after failed creation', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const existingName = uniqueName('Web Development 2026');
    const failedName = uniqueName('Unsaved Program');
    const existingCreated = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(existingName, 'Full-stack web development program');
    const existingBody = (await (await existingCreated).json()) as { data?: { id?: string } };
    const existingId = existingBody.data?.id;
    if (!existingId) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(existingId);
    await programs.scrollProgramNameIntoView(existingName);
    await expect(programs.programNameText(existingName)).toBeVisible();
    await page.route('**/api/programs', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"error"}' });
        return;
      }
      await route.continue();
    });
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
    await modal.fillProgramName(failedName);
    await modal.fillDescription('This create should fail');
    const failed = page.waitForResponse(
      (response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/api/programs',
    );
    await modal.clickCreate();

    expect((await failed).status()).toBe(500);
    await expect(modal.dialog).toBeVisible();
    await expect(programs.programNameText(failedName)).toHaveCount(0);
    await programs.scrollProgramNameIntoView(existingName);
    await expect(programs.programNameText(existingName)).toBeVisible();
  });

  test('TC-009: program list does not display internal or system fields', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, description);
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const text = await programs.programCell(name).innerText();
    expect(text).toContain(name);
    expect(text).toContain(description);
    expect(text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

test.describe('Edge cases', () => {
  test('TC-011: program with empty description displays gracefully in the list', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Minimal Program');
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name);
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    await expect(programs.programCellByExactName(name)).toHaveText(name);
  });

  test('TC-012: program with long name and description displays without breaking layout', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = nameOfLength(255);
    const marker = `D${Date.now()}`;
    const description = `${marker}${'D'.repeat(1000 - marker.length)}`;
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, description);
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const nameText = programs.textInProgramCell(name, name);
    const descriptionText = programs.textInProgramCell(name, description);
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

  test('TC-013: program with special characters in name and description displays correctly', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Informatique & IA - Niveau 2');
    const description = `Curriculum "advanced" & research ${Date.now()}`;
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, description);
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const descriptionText = programs.textInProgramCell(name, description);
    await expect(descriptionText).toBeVisible({ timeout: 45_000 });
    await expect(descriptionText).toHaveText(description);
  });

  test('TC-014: large number of programs displays with acceptable performance', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const loaded = page.waitForResponse((response) => isProgramsResponse(response, 'GET'));
    const started = Date.now();
    await page.reload();
    await loaded;
    const elapsed = Date.now() - started;

    await expect(programs.table).toBeVisible({ timeout: 30_000 });
    await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
    expect(elapsed).toBeLessThan(3_000);
    const list = await programs.getProgramListMetrics();
    expect(list.rows).toBeGreaterThanOrEqual(100);
    expect(list.scrolls).toBe(true);
  });

  test('TC-015: program list sort order is consistent', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const names = [uniqueName('Alpha Program'), uniqueName('Beta Program'), uniqueName('Gamma Program')];
    for (const name of names) {
      const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
      await programs.createProgram(name, 'Sort order check');
      const body = (await (await created).json()) as { data?: { id?: string } };
      const id = body.data?.id;
      if (!id) {
        throw new Error('Create program response did not include data.id');
      }
      trackProgram(id);
      await programs.scrollProgramNameIntoView(name);
      await expect(programs.programNameText(name)).toBeVisible();
    }

    const before = await programs.getRowIndexesForProgramNames(names);
    expect(before.every((index) => index >= 0)).toBe(true);
    await page.reload();
    await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
    for (const name of names) {
      await expect(programs.programNameText(name)).toBeAttached({ timeout: 45_000 });
    }
    const after = await programs.getRowIndexesForProgramNames(names);

    const orderOf = (indexes: number[]) => indexes.map((index, position) => position).sort((left, right) => indexes[left] - indexes[right]);
    expect(orderOf(after)).toEqual(orderOf(before));
  });

  test('TC-017: program list is accessible via keyboard navigation', async ({ page, browserName, trackProgram }) => {
    // Playwright's WebKit build does not move DOM focus when Tab is pressed. The buttons are in the tab order (tabIndex 0).
    test.skip(browserName === 'webkit', 'Playwright WebKit does not move focus on Tab, so this keyboard flow cannot be driven there');

    const programs = new ProgramsPage(page);
    const name = uniqueName('Keyboard Program');
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Keyboard access check');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const id = body.data?.id;
    if (!id) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(id);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const edit = programs.editProgramButton(name);
    const remove = programs.deleteProgramButton(name);
    const row = programs.programRow(name);

    await edit.scrollIntoViewIfNeeded({ timeout: 45_000 });
    await edit.focus();
    await programs.pressKey('Shift+Tab');
    await programs.pressKey('Tab');
    await expect(edit).toBeFocused();
    expect(await edit.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid');
    await programs.pressKey('Enter');
    const editModal = new EditProgramModal(page);
    await expect(editModal.dialog).toBeVisible({ timeout: 15_000 });
    await editModal.dismissWithEscape();
    await expect(editModal.dialog).toBeHidden({ timeout: 30_000 });

    await remove.scrollIntoViewIfNeeded({ timeout: 45_000 });
    await remove.focus();
    await programs.pressKey('Shift+Tab');
    await programs.pressKey('Tab');
    await expect(remove).toBeFocused();
    const confirmation = new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
      page.once('dialog', async (nativeDialog) => {
        clearTimeout(timer);
        await nativeDialog.dismiss();
        resolve();
      });
    });
    await programs.pressKey('Enter');
    await confirmation;
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(row).toBeVisible();
  });
});
