import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName } from '../utils/test-data';

/**
 * DS-3 (supplement): Program name validation — special characters preserved in list.
 * Ticket: Test Cases/DS-3/DS-3_output.md — TC-001
 */
test.describe.configure({ mode: 'default', timeout: 180_000 });

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
});

test('TC-001: program name with special characters is preserved exactly in the list', async ({
  page,
  trackProgram,
}) => {
  const programs = new ProgramsPage(page);
  const name = uniqueName('Informatique & IA - Niveau 2');
  const description = 'Program with special characters';
  const modal = await programs.openNewProgramForm();

  await expect(modal.dialog).toBeVisible({ timeout: 15_000 });
  await modal.fillProgramName(name);
  await modal.fillDescription(description);
  trackProgram(await modal.submitCreateWithReload());

  await programs.scrollProgramNameIntoView(name);
  await expect(programs.programNameText(name)).toBeVisible({ timeout: 45_000 });
  await expect(programs.textInProgramCell(name, name)).toHaveText(name);
  await expect(programs.textInProgramCell(name, description)).toBeVisible();
  await expect(programs.alerts).toHaveCount(0);
});
