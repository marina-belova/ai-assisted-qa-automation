import { test, expect } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueNameSimple } from '../utils/test-data';

test.beforeEach(async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.goto();
  await expect(programs.newProgramButton).toBeVisible();
});

test.describe('Verify New Semester date validation', () => {
  test(
    'Create Semester stays disabled when the end date is empty',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, {
        reloadAfterCreate: true,
        onCreated: trackProgram,
      });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }

      await programs.selectProgram(name);
      await expect(programs.semesterPanelHeading(name)).toBeVisible();
      await expect(programs.noSemestersMessage).toBeVisible({ timeout: 20_000 });
      const modal = await programs.openNewSemesterForm();

      await modal.fillSemesterName(uniqueNameSimple('Semester 1'));
      await modal.fillStartDate('2026-09-01');

      await expect(modal.endDateField).toHaveValue('');
      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
    },
  );

  test(
    'Create Semester becomes enabled for a date range that ends after it starts',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, {
        reloadAfterCreate: true,
        onCreated: trackProgram,
      });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }

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

  test(
    'An end date before the start date is saved without an error message',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programs = new ProgramsPage(page);
      const name = uniqueNameSimple('Program without semesters');
      const description = 'Semester panel seed';
      const uuid = await programs.createProgram(name, description, {
        reloadAfterCreate: true,
        onCreated: trackProgram,
      });
      if (typeof uuid !== 'string') {
        throw new Error('createProgram did not return a program uuid');
      }

      await programs.selectProgram(name);
      await expect(programs.semesterPanelHeading(name)).toBeVisible();
      await expect(programs.noSemestersMessage).toBeVisible({ timeout: 20_000 });
      const modal = await programs.openNewSemesterForm();

      const semesterName = uniqueNameSimple('Date Check');
      await modal.fillSemesterName(semesterName);
      await modal.fillStartDate('2026-09-01');
      await modal.fillEndDate('2026-08-01');
      await modal.clickCreate();

      await expect(modal.dialog).toBeHidden();
      await expect(programs.semesterText(semesterName)).toBeVisible();
      await expect(programs.semesterText('2026-09-01 \u2014 2026-08-01')).toBeVisible();
      await expect(programs.alerts).toHaveCount(0);
    },
  );
});
