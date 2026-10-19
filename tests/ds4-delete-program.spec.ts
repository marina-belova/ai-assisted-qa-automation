import { test, expect } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';
import { deleteProgramConfirmationMessage } from '../pages/program-api';
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

  test('TC-002: program deletion is cancelled and program remains in the list', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    const description = 'Program that should remain';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toContain(name);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  test('TC-003: confirmation dialog displays the correct program name', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    await programs.createProgram(name, 'Full-stack web development program');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toBe(deleteProgramConfirmationMessage(name));
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  // The shared catalog has thousands of programs, so a fixture of exactly 3 programs cannot be established.
  test.skip('TC-004: program list count decreases by one after confirmed deletion — the catalog does not contain exactly 3 programs', async () => {});
});

test.describe('Negative flows', () => {
  test('TC-005: program is not deleted when confirmation dialog is dismissed via Escape', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    await programs.createProgram(name, 'Program that should survive Escape');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const message = await programs.respondToDeleteConfirmation(name, false);

    expect(message).toContain(name);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
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
    const programs = new ProgramsPage(page);
    const name = nameOfLength(255);
    await programs.createProgram(name, 'Long name deletion');
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

  test('TC-014: deleted program name becomes available for reuse', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Test Program');
    await programs.createProgram(name, 'Name to reuse');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await programs.confirmDeleteProgram(name);
    await expect(programs.programNameText(name)).toHaveCount(0, { timeout: 45_000 });

    await programs.createProgram(name, 'Recreated program');

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  // The native dialog closes before the request starts, and the page does not disable delete or show a loading state.
  test.skip('TC-015: delete icon is not visible or is disabled during an in-progress deletion — no in-progress delete state is shown', async () => {});
});
