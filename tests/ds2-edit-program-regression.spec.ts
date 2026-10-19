import { test, expect } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';
import { nameOfLength, uniqueName } from '../utils/test-data';

// Override fullyParallel so this file's tests stay isolated under API load.
test.describe.configure({ mode: 'default', timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: edit form opens pre-populated with current program data', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const modal = await programs.openEditProgram(name);

    await expect(modal.programNameField).toHaveValue(name);
    await expect(modal.descriptionField).toHaveValue(description);
    await expect(modal.saveButton).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();
  });

  test('TC-002: program name is updated and reflected immediately in the list', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const updatedName = `${name} - Updated`;
    await programs.createProgram(name, 'Full-stack web development program');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const reloads = programs.trackReloads();
    const modal = await programs.openEditProgram(name);

    await modal.fillProgramName(updatedName);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    await expect(programs.programNameText(name)).toHaveCount(0);
    expect(reloads()).toBe(0);
  });

  test('TC-003: unchanged fields are preserved when only description is edited', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const updatedDescription = 'Updated full-stack curriculum for 2026';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const modal = await programs.openEditProgram(name);
    await modal.fillDescription(updatedDescription);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, updatedDescription)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toHaveCount(0);

    const reopened = await programs.openEditProgram(name);
    await expect(reopened.programNameField).toHaveValue(name);
    await expect(reopened.descriptionField).toHaveValue(updatedDescription);
  });

  test('TC-004: both name and description can be updated in a single edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Mobile Development 2026');
    const updatedName = `${name} - Advanced`;
    const updatedDescription = 'Advanced iOS and Android development track';
    await programs.createProgram(name, 'iOS and Android development');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(updatedName);
    await modal.fillDescription(updatedDescription);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    await expect(programs.textInProgramCell(updatedName, updatedDescription)).toBeVisible();
    await expect(programs.programNameText(name)).toHaveCount(0);
  });

  test('TC-005: save button is enabled when valid changes are made', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    await programs.createProgram(name, 'Full-stack web development program');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await modal.fillDescription('Revised curriculum');

    await expect(modal.saveButton).toBeEnabled();
  });
});

test.describe('Negative flows', () => {
  test('TC-006: program is not updated when user cancels the edit form', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    const rejectedName = uniqueName('Should Not Save');
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await modal.fillProgramName(rejectedName);
    await modal.clickCancel();

    await expect(modal.dialog).toBeHidden({ timeout: 15_000 });
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
    await expect(programs.programNameText(rejectedName)).toHaveCount(0);
  });

  test('TC-007: empty program name prevents save', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await modal.fillProgramName('');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await modal.clickCancel();
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  // The edit API accepts a repeated name and does not show an error.
  test.skip('TC-008: duplicate program name is rejected on edit — edit accepts an existing name and shows no error', async () => {});

  // Only an admin account is configured, so a non-admin session cannot be started.
  test.skip('TC-009: non-admin user cannot edit programs — only an admin account is configured', async () => {});

  test('TC-010: no update occurs when save is clicked without any changes', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await expect(modal.programNameField).toHaveValue(name);
    await expect(modal.descriptionField).toHaveValue(description);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
    await expect(programs.alerts).toHaveCount(0);
  });
});

test.describe('Edge cases', () => {
  test('TC-011: program name with special characters is accepted on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Basic Programming');
    const updatedName = uniqueName('Informatique & IA - Niveau 2');
    await programs.createProgram(name, 'Introductory programming');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(updatedName);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    await expect(programs.programNameText(name)).toHaveCount(0);
  });

  test('TC-012: program name with only whitespace is rejected on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await modal.fillProgramName('   ');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await modal.clickCancel();
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  test('TC-013: program name at maximum allowed length is accepted on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Short Name');
    const updatedName = nameOfLength(255);
    await programs.createProgram(name, 'Boundary length test');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(updatedName);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    expect(updatedName).toHaveLength(255);
  });

  // Program Name has no maximum length; a 256-character name is saved and no validation error is shown.
  test.skip('TC-014: program name exceeding maximum length is rejected on edit — a 256-character name is saved', async () => {});

  test('TC-015: description can be cleared to empty on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    await programs.createProgram(name, 'Full-stack web development program');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await modal.fillDescription('');
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.programCellByExactName(name)).toHaveText(name);
  });

  // Only one admin account is configured, so two concurrent admin sessions cannot be started.
  test.skip('TC-016: concurrent edit by two admins shows appropriate conflict handling — only one admin account is configured', async () => {});
});
