import { test, expect } from '../fixtures/cleanup.fixture';
import AxeBuilder from '@axe-core/playwright';
import { ProgramsPage } from '../pages/ProgramsPage';
import { uniqueName } from '../utils/test-data';

test.describe.configure({ mode: 'default', timeout: 180_000 });

test.describe('Programs Edit Program modal accessibility', () => {
  test.beforeEach(async ({ page }) => {
    const programs = new ProgramsPage(page);
    await programs.gotoAndWaitForProgramsList();
    await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });
  });

  test('Edit Program modal has no axe violations within dialog scope', async ({ page, trackProgram }) => {
    const programs = new ProgramsPage(page);
    const name = uniqueName('A11y Edit Program');
    const description = 'Program used for Edit Program modal accessibility scan';

    const createModal = await programs.openNewProgramForm();
    await expect(createModal.dialog).toBeVisible({ timeout: 15_000 });
    await createModal.fillProgramName(name);
    await createModal.fillDescription(description);
    trackProgram(await createModal.submitCreateWithReload());

    await programs.scrollProgramNameIntoView(name);
    await expect(programs.programNameText(name)).toBeVisible({ timeout: 45_000 });

    const editModal = await programs.openEditProgram(name);
    await expect(editModal.dialog).toBeVisible({ timeout: 15_000 });
    await expect(editModal.programNameField).toHaveValue(name);

    const results = await new AxeBuilder({ page })
      .include([['section[role="dialog"][aria-modal="true"]']])
      // Document-level heading rule does not apply when scanning only the open dialog subtree.
      .disableRules(['page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
