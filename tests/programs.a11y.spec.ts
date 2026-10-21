import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ProgramsPage } from '../pages/ProgramsPage';

test.describe('Programs accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.gotoAndWaitForProgramsList();
    await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
  });

  test('Programs page has no axe violations', { tag: '@regression' }, async ({ page }) => {
    const results = await new AxeBuilder({ page }).analyze();

    expect(results.violations).toEqual([]);
  });

  test('New Program modal has no axe violations within dialog scope', async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    const results = await new AxeBuilder({ page })
      .include([['section[role="dialog"][aria-modal="true"]']])
      // Example: omit document-level rules when scanning only the open dialog subtree.
      .disableRules(['page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
