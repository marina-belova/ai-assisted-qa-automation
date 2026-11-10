import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueNameSimple } from '../utils/test-data';

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.newProgramButton).toBeVisible();
});

test.describe('Validate New Semester required fields', () => {
  test(
    'Create Semester is disabled when the required fields are empty',
    { tag: '@ds295-empty-fields' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, { reloadAfterCreate: true });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }
      trackProgram(uuid);

      await programs.selectProgram(name);
      await expect(programs.semesterPanelHeading(name)).toBeVisible();
      await expect(programs.noSemestersMessage).toBeVisible({ timeout: 20_000 });
      const modal = await programs.openNewSemesterForm();

      await expect(modal.semesterNameField).toHaveValue('');
      await expect(modal.startDateField).toHaveValue('');
      await expect(modal.endDateField).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
    },
  );

  test(
    'Create Semester stays disabled when only the semester name is entered',
    { tag: '@ds295-name-only' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, { reloadAfterCreate: true });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }
      trackProgram(uuid);

      await programs.selectProgram(name);
      await expect(programs.semesterPanelHeading(name)).toBeVisible();
      await expect(programs.noSemestersMessage).toBeVisible({ timeout: 20_000 });
      const modal = await programs.openNewSemesterForm();

      await modal.fillSemesterName(uniqueNameSimple('Semester 1'));

      await expect(modal.startDateField).toHaveValue('');
      await expect(modal.endDateField).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    },
  );

  test(
    'Create Semester becomes enabled when the name and both dates are filled',
    { tag: '@ds295-dates-enable' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, { reloadAfterCreate: true });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }
      trackProgram(uuid);

      await programs.selectProgram(name);
      await expect(programs.semesterPanelHeading(name)).toBeVisible();
      await expect(programs.noSemestersMessage).toBeVisible({ timeout: 20_000 });
      const modal = await programs.openNewSemesterForm();

      await modal.fillSemesterName(uniqueNameSimple('Semester 1'));
      await modal.fillStartDate('2026-09-01');
      await modal.fillEndDate('2026-12-15');

      await expect(modal.createButton).toBeEnabled();
    },
  );
});
