import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { deleteProgramConfirmationMessage, isProgramsResponse } from '../pages/program-api';
import { nameOfLength, uniqueName } from '../utils/test-data';

// Override fullyParallel so this file's tests stay isolated under API load.
test.describe.configure({ mode: 'default', timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: program is deleted after user confirms in the dialog', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    await programs.createProgram(name, 'Program created for deletion');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.confirmDeleteProgram(name);

    expect(message).toBe(deleteProgramConfirmationMessage(name));
    await expect(programs.programNameText(name)).toHaveCount(0, { timeout: 45_000 });
  });

  test('TC-002: program deletion is cancelled and program remains in the list', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    const description = 'Program that should remain';
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, description);
    const body = (await (await created).json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(uuid);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toContain(name);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  test('TC-003: confirmation dialog displays the correct program name', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Full-stack web development program');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(uuid);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toBe(deleteProgramConfirmationMessage(name));
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-005: program is not deleted when confirmation dialog is dismissed via Escape', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Program that should survive Escape');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(uuid);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toContain(name);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });
});

test.describe('Edge cases', () => {
  test('TC-011: deleting a program with a long name displays correctly in confirmation dialog', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = nameOfLength(255);
    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Long name deletion');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(uuid);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toBe(deleteProgramConfirmationMessage(name));
    expect(name).toHaveLength(255);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  test('TC-012: deleting a program with special characters in the name works correctly', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Informatique & IA - Niveau 2');
    await programs.createProgram(name, 'Special character deletion');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.confirmDeleteProgram(name);

    expect(message).toBe(deleteProgramConfirmationMessage(name));
    await expect(programs.programNameText(name)).toHaveCount(0, { timeout: 45_000 });
  });

  test('TC-013: cancelled deletion allows immediate retry', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    await programs.createProgram(name, 'Cancel then delete');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    await programs.respondToDeleteConfirmation(name, false);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await programs.confirmDeleteProgram(name);

    await expect(programs.programNameText(name)).toHaveCount(0, { timeout: 45_000 });
  });

  test('TC-014: deleted program name becomes available for reuse', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    await programs.createProgram(name, 'Name to reuse');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await programs.confirmDeleteProgram(name);
    await expect(programs.programNameText(name)).toHaveCount(0, { timeout: 45_000 });

    const created = page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await programs.createProgram(name, 'Recreated program');
    const body = (await (await created).json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    trackProgram(uuid);

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });
});
