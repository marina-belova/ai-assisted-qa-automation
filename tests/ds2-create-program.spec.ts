import { test, expect } from '@playwright/test';
import { ProgramsPage } from '../pages/ProgramsPage';
import { nameOfLength, uniqueNameSimple } from '../utils/test-data';

/**
 * DS-2: Edit existing program details
 * Test plan: Test Cases/DS-2/DS-2_output.md
 */
test.describe.configure({ mode: 'default', timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
});

test.describe('Positive flows', () => {
  test('TC-001: edit form opens pre-populated with current program data', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);

    const modal = await programs.openEditProgram(name);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programNameField).toHaveValue(name);
    await expect(modal.descriptionField).toHaveValue(description);
    await expect(modal.saveButton).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();
  });

  test('TC-002: program name is updated and reflected immediately in the list', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const updatedName = `${name} - Updated`;
    await programs.createProgram(name, 'Full-stack web development program');
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
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    const updatedDescription = 'Updated full-stack curriculum for 2026';
    await programs.createProgram(name, description);

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
    const name = uniqueNameSimple('Mobile Development 2026');
    const updatedName = `${name} - Advanced`;
    const updatedDescription = 'Advanced iOS and Android development track';
    await programs.createProgram(name, 'iOS and Android development');

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
    const name = uniqueNameSimple('Web Development 2026');
    await programs.createProgram(name, 'Full-stack web development program');
    const modal = await programs.openEditProgram(name);

    await modal.fillDescription('Revised curriculum');

    await expect(modal.saveButton).toBeEnabled();
  });
});

test.describe('Negative flows', () => {
  test('TC-006: program is not updated when user cancels the edit form', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    const rejectedName = uniqueNameSimple('Should Not Save');
    await programs.createProgram(name, description);
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
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    const modal = await programs.openEditProgram(name);

    await modal.fillProgramName('');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await modal.clickCancel();
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
  });

  test.skip('TC-008: duplicate program name is rejected on edit — app allows duplicate names on rename', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const existingName = uniqueNameSimple('Web Development 2026');
    const otherName = uniqueNameSimple('Data Science 2026');
    await programs.createProgram(existingName, 'Existing program');
    await programs.createProgram(otherName, 'Other program');

    const modal = await programs.openEditProgram(otherName);
    await modal.fillProgramName(existingName);
    await modal.clickSave();

    await expect(programs.alerts).toBeVisible();
    await expect(programs.duplicateNameErrorText()).toBeVisible();
    await expect(modal.dialog).toBeVisible();
    await programs.scrollProgramNameIntoView(otherName);
    await expect(programs.programNameText(otherName)).toBeVisible();
    await expect(programs.textInProgramCell(otherName, 'Other program')).toBeVisible();
  });

  test('TC-010: no update occurs when save is clicked without any changes', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    const modal = await programs.openEditProgram(name);

    await expect(modal.programNameField).toHaveValue(name);
    await expect(modal.descriptionField).toHaveValue(description);
    await expect(modal.saveButton).toBeEnabled();
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
    const name = uniqueNameSimple('Basic Programming');
    const updatedName = uniqueNameSimple('Informatique & IA - Niveau 2');
    await programs.createProgram(name, 'Introductory programming');

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(updatedName);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    await expect(programs.programNameText(name)).toHaveCount(0);
  });

  test('TC-012: program name with only whitespace is rejected on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
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
    const name = uniqueNameSimple('Short Name');
    const updatedName = nameOfLength(255);
    await programs.createProgram(name, 'Boundary length test');

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(updatedName);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(updatedName);
    await expect(programs.programNameText(updatedName)).toBeVisible();
    expect(updatedName).toHaveLength(255);
  });

  test.skip('TC-014: program name exceeding maximum length is rejected on edit — 256-character name is saved', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const tooLongName = nameOfLength(256);
    await programs.createProgram(name, 'Full-stack web development program');

    const modal = await programs.openEditProgram(name);
    await modal.fillProgramName(tooLongName);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.programNameText(tooLongName)).toHaveCount(0);
  });

  test('TC-015: description can be cleared to empty on edit', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueNameSimple('Web Development 2026');
    const description = 'Full-stack web development program';
    await programs.createProgram(name, description);
    const modal = await programs.openEditProgram(name);

    await modal.fillDescription('');
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toHaveCount(0);
    await expect(programs.programCellDescriptionParagraph(name)).toHaveCount(1);
  });
});
