import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ProgramsPage } from '../pages/ProgramsPage';
import { expectNoAxeViolations } from '../utils/a11y';

test.describe('Programs accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.gotoAndWaitForProgramsList();
    await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
  });

  // Test details only accept tag, annotation, and lock. A timeout there is ignored.
  test('Programs page has no axe violations', { tag: '@regression' }, async ({ page }) => {
    test.setTimeout(120_000);
    // The catalog is one table with thousands of identical rows. Scanning all of
    // them keeps axe inside page.evaluate until the test timeout on GitHub Actions.
    const pageResults = await new AxeBuilder({ page }).exclude('table').analyze();
    // Header plus the first rendered data row. No program is created for this scan.
    const programs = new ProgramsPage(page);
    await expect(programs.table.getByRole('row').nth(1)).toBeVisible();
    const tableSampleResults = await new AxeBuilder({ page })
      .include('table thead')
      .include('table tbody tr:first-of-type')
      .analyze();

    await expectNoAxeViolations([
      ...pageResults.violations,
      ...tableSampleResults.violations,
    ]);
  });

  test('New Program modal has no axe violations within dialog scope', { tag: '@regression' }, async ({ page }) => {
    const programs = new ProgramsPage(page);
    const modal = await programs.openNewProgramForm();
    await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

    const results = await new AxeBuilder({ page })
      .include([['section[role="dialog"][aria-modal="true"]']])
      // Example: omit document-level rules when scanning only the open dialog subtree.
      .disableRules(['page-has-heading-one'])
      .analyze();

    await expectNoAxeViolations(results.violations);
  });
});
