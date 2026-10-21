---
name: a11y-checks
description: Accessibility testing with @axe-core/playwright for Didaxis Studio. Use when adding or reviewing a11y specs, axe scans, or Part 3 homework for programs UI.
---

# Accessibility checks (Part 3)

Automated accessibility tests use **@axe-core/playwright** against Didaxis with the same auth and POM patterns as functional tests.

Reference implementation: `tests/programs.a11y.spec.ts`.

## Dependencies

- `@axe-core/playwright` (already in `package.json`)
- Import: `import AxeBuilder from '@axe-core/playwright';`

## Authentication

- Use Playwright **`storageState`** (`playwright/.auth/user.json` via the `setup` project).
- **Do not** add UI login to a11y specs.
- Navigate with **`ProgramsPage`** (`goto()` or `gotoAndWaitForProgramsList()`).

## Page Object Model

- **Navigation and interactions** — `ProgramsPage`, `NewProgramModal`, `EditProgramModal` (see `pom-conventions` skill).
- **Assertions** — Stay in spec files: `expect(results.violations).toEqual([])`.
- **Do not** put `expect()` or `AxeBuilder` inside Page Objects.

## Full-page scan

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ProgramsPage } from '../pages/ProgramsPage';

test('Programs page has no axe violations', { tag: '@regression' }, async ({ page }) => {
  const programs = new ProgramsPage(page);
  await programs.gotoAndWaitForProgramsList();
  await expect(programs.newProgramButton).toBeVisible({ timeout: 30_000 });

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

Tag regression a11y smoke with `{ tag: '@regression' }` when appropriate.

## Scoped (component) scan

Open UI through POM, assert the target is visible, then scope axe to the component:

```ts
const programs = new ProgramsPage(page);
const modal = await programs.openNewProgramForm();
await expect(modal.dialog).toBeVisible({ timeout: 15_000 });

const results = await new AxeBuilder({ page })
  .include([['section[role="dialog"][aria-modal="true"]']])
  // Only when justified — see disableRules below
  .disableRules(['page-has-heading-one'])
  .analyze();

expect(results.violations).toEqual([]);
```

Use `.include()` (and optionally `.exclude()`) so the scan matches the component under test. Prefer selectors that match the open component when only one modal is on screen.

## disableRules() policy

- **Never** disable or weaken rules to hide **real** violations (e.g. do not disable `color-contrast` or `button-name` to force green builds).
- **Only** use `.disableRules([...])` when:
  1. The rule is **not applicable** to the scoped context (e.g. `page-has-heading-one` on a dialog-only `.include()` scan), and
  2. You add a **short comment** in the spec explaining why.
- If the app has fixable violations, **fail the test** and file/fix in the product — do not patch the test.

## Interpreting failures

When `results.violations` is non-empty, report:

- Rule `id` (e.g. `color-contrast`, `button-name`)
- `impact` (critical, serious, moderate)
- `help` / `description` and affected nodes (from test output or `violations[i].nodes`)

Common Didaxis findings (examples from programs scans):

| Rule | Typical issue |
|------|----------------|
| `color-contrast` | Text/button labels below WCAG 2 AA 4.5:1 (sidebar, page subtitle, modal buttons) |
| `page-has-heading-one` | Programs page missing an `<h1>` |
| `button-name` | Icon-only modal close control without accessible name |

## Conventions checklist

- [ ] `@axe-core/playwright` + `AxeBuilder({ page }).analyze()`
- [ ] `storageState` auth, no per-test login
- [ ] POM for goto / open modal / interactions
- [ ] Assertions in spec only
- [ ] Full-page and/or scoped `.include()` scans as required
- [ ] `@regression` tag on key full-page a11y smoke when requested
- [ ] No rule disabling except documented, context-justified cases
- [ ] See also: `pom-conventions`, `api-cleanup` (when a11y tests create data)

## Running

```bash
npx playwright test tests/programs.a11y.spec.ts
npx playwright test --grep @regression
```

Do not weaken assertions to pass; fix accessibility in the application or accept failing tests until fixed.
