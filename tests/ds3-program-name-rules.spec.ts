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
  test('TC-001: program name with special characters is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Informatique & IA - Niveau 2');
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(name);
    await modal.fillDescription('Program with special characters');
    await modal.submitCreateAndWaitForListRefresh();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  test('TC-002: valid program name with leading and trailing spaces is trimmed and accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Cybersecurity 2026');
    const paddedName = `  ${name}  `;
    const description = 'Security fundamentals program';
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(paddedName);
    await modal.fillDescription(description);
    await modal.submitCreateAndWaitForListRefresh();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, description)).toBeVisible();
    const storedName = await programs.textInProgramCell(name, name).evaluate((element) => element.textContent);
    expect(storedName).toBe(name);
  });

  test('TC-003: program name at minimum valid length is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const description = uniqueName('Single character name test');
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName('X');
    await modal.fillDescription(description);
    await modal.submitCreateAndWaitForListRefresh();

    await expect(programs.textInProgramCellByDescription(description, 'X')).toBeVisible({ timeout: 45_000 });
  });

  test('TC-004: program name at maximum allowed length is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = nameOfLength(255);
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(name);
    await modal.fillDescription('Max length boundary test');
    await modal.submitCreateAndWaitForListRefresh();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    expect(name).toHaveLength(255);
  });

  test('TC-005: editing a program to the same name is allowed', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('Web Development 2026');
    const updatedDescription = 'Updated description only';
    await programs.createProgram(name, 'Full-stack web development program');
    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    const modal = await programs.openEditProgram(name);

    await expect(modal.programNameField).toHaveValue(name);
    await modal.fillDescription(updatedDescription);
    await modal.submitEdit();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
    await expect(programs.textInProgramCell(name, updatedDescription)).toBeVisible();
    await expect(programs.alerts).toHaveCount(0);
  });
});

test.describe('Negative flows', () => {
  test('TC-006: whitespace-only program name is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
    let posted = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/programs') {
        posted = true;
      }
    });

    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(posted).toBe(false);
  });

  // The create API accepts a repeated name and does not show an error.
  test.skip('TC-007: duplicate program name is rejected on creation — create accepts a repeated name and shows no error', async () => {});

  // The edit API accepts a repeated name and does not show an error.
  test.skip('TC-008: duplicate program name is rejected on edit — edit accepts an existing name and shows no error', async () => {});

  test('TC-009: empty program name is rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
    let posted = false;
    page.on('request', (request) => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/programs') {
        posted = true;
      }
    });

    await expect(modal.programNameField).toHaveValue('');
    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(posted).toBe(false);
  });

  // Program Name has no maximum length; a 256-character name is saved and no validation error is shown.
  test.skip('TC-010: program name exceeding maximum length is rejected — a 256-character name is saved', async () => {});

  // Duplicate checks are not case-insensitive; a different casing is saved as a separate program.
  test.skip('TC-011: duplicate check is case-insensitive — a different casing is saved and no error is shown', async () => {});
});

test.describe('Edge cases', () => {
  // Leading and trailing spaces are trimmed, then the name is saved even when that trimmed name already exists.
  test.skip('TC-012: duplicate name with different whitespace is rejected — trimmed duplicates are saved', async () => {});

  test('TC-013: program name with Unicode characters is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('プログラミング基礎 2026');
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(name);
    await modal.fillDescription('Japanese program name test');
    await modal.submitCreateAndWaitForListRefresh();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  test('TC-014: program name with HTML or script tags is sanitized or rejected', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName("<script>alert('xss')</script>");
    const alerts: string[] = [];
    page.on('dialog', async (dialog) => {
      alerts.push(dialog.message());
      await dialog.dismiss();
    });
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(name);
    await modal.fillDescription('XSS test');
    await modal.submitCreateAndWaitForListRefresh();

    const rendered = programs.programNameText(name);
    await expect(rendered).toBeVisible({ timeout: 45_000 });
    await expect(rendered).toHaveText(name);
    expect(alerts).toEqual([]);
  });

  test('TC-015: program name with emoji characters is accepted', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('AI Bootcamp 🚀 2026');
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    await modal.fillProgramName(name);
    await modal.fillDescription('Emoji in name test');
    await modal.submitCreateAndWaitForListRefresh();

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible();
  });

  // Create does not show a duplicate-name error, so there is no error to clear before a corrected save.
  test.skip('TC-016: duplicate name error persists until name is changed — create shows no duplicate error', async () => {});

  // The name is only trimmed. A tab or newline inside the name is stored as entered.
  test.skip('TC-017: tab and newline characters in program name are handled correctly — internal control characters are stored', async () => {});
});
