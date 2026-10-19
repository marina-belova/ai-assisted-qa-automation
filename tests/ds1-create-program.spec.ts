import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueNameSimple } from '../utils/test-data';

test.describe.configure({ mode: 'default', timeout: 90_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.newProgramButton).toBeVisible();
});

test.describe('Positive flows', () => {
  test('TC-001: program creation form displays required fields', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.programNameField).toBeVisible();
    await expect(modal.descriptionField).toBeVisible();
    await expect(modal.createButton).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();
  });

  test('TC-002: program is created successfully with valid name and description', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.fillDescription(description);
    trackProgram(await modal.submitCreateWithReload());

    await expect(programs.programNameText(name)).toBeVisible({ timeout: 20_000 });
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
    await expect(programs.alerts).toHaveCount(0);
  });

  test('TC-003: program is created successfully with name only and empty description', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Data Science Fundamentals');
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    trackProgram(await modal.submitCreateWithReload());

    await expect(programs.programNameText(name)).toBeVisible({ timeout: 20_000 });
    await expect(programs.programCellByExactName(name)).toHaveText(name);
    await expect(programs.alerts).toHaveCount(0);
  });

  test('TC-004: Create button remains disabled until Program Name is provided', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();

    await expect(modal.programNameField).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-005: Create button becomes enabled after entering a valid Program Name', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();

    await expect(modal.createButton).toBeDisabled();
    await modal.fillProgramName(uniqueNameSimple('Cloud Computing 2026'));
    await expect(modal.createButton).toBeEnabled();
  });
});

test.describe('Negative flows', () => {
  test('TC-006: program is not created when submission is attempted with empty Program Name', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();

    await modal.fillDescription(uniqueNameSimple('Some description'));

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-007: program is not created when user cancels the creation form', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Cancelled Program');
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.fillDescription('This should not be saved');
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden({ timeout: 15_000 });
    await expect(programs.programNameText(name)).toHaveCount(0);
  });

  test.skip('TC-008: non-admin user cannot access program creation form', async () => {});

  test.skip('TC-009: duplicate program name is rejected on creation', async () => {});
});

test.describe('Edge cases', () => {
  test('TC-010: program name at maximum allowed length is accepted', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const suffix = ` ${Date.now()}`;
    const name = `${'A'.repeat(255 - suffix.length)}${suffix}`;
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.fillDescription('Boundary length test');
    trackProgram(await modal.submitCreateWithReload());

    await expect(programs.programNameText(name)).toBeVisible({ timeout: 20_000 });
  });

  test.skip('TC-011: program name exceeding maximum length is rejected', async () => {});

  test('TC-012: program name with special characters is accepted', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Informatique & IA - Niveau 2');
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.fillDescription('Program with special characters');
    trackProgram(await modal.submitCreateWithReload());

    await expect(programs.programNameText(name)).toBeVisible({ timeout: 20_000 });
  });

  test('TC-013: program name with only whitespace is treated as empty', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-014: description at maximum allowed length is accepted', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Long Description Program');
    const marker = `D${Date.now()}`;
    const description = `${marker}${'D'.repeat(1000 - marker.length)}`;
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.fillDescription(description);
    trackProgram(await modal.submitCreateWithReload());

    await expect(programs.programNameText(name)).toBeVisible({ timeout: 20_000 });
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  test('TC-015: closing modal via Escape does not create a program', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Unsaved Program');
    const modal = await programs.openNewProgramForm();

    await modal.fillProgramName(name);
    await modal.dismissWithEscape();

    await expect(modal.dialog).toBeHidden({ timeout: 15_000 });
    await expect(programs.programNameText(name)).toHaveCount(0);
  });
});
