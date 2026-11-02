---
name: a11y-checks
description: Accessibility testing with @axe-core/playwright for Didaxis Studio. Use when adding or reviewing a11y specs, axe scans, or Programs page keyboard coverage.
---

# Accessibility checks (Programs)

Use `@axe-core/playwright` with stored-session auth and the existing Page Objects. Do not add UI login. Do not put `expect()` or `AxeBuilder` inside a Page Object. Do not edit application source.

Each accessibility test has exactly one tag, and that tag names the scenario.

If `results.violations` is not empty, report each rule `id`, `impact`, `help`, and the affected nodes, then stop. Do not use `disableRules()`, do not call `utils/a11y.ts` `expectNoAxeViolations`, and do not weaken the assertion so CI stays green. That helper records violations and lets the test pass when `CI` is set. Do not file a Jira bug unless a human approves it.

## Programs page scan

```ts
const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze();

expect(results.violations).toEqual([]);
```

Open the page with `ProgramsPage.gotoAndWaitForProgramsList()` and assert `programs.newProgramButton` is visible before the scan.

`wcag2a` and `wcag2aa` are the WCAG 2.0 A and AA tags. Do not omit them.

A Playwright MCP scan of `https://test.didaxis.studio/programs` with those tags found one serious violation: `color-contrast` (`Elements must meet minimum color contrast ratio thresholds`) on 863 nodes. Report that and stop. Do not hide it.

## include() and exclude()

Do not use `.include()` or `.exclude()` to skip product UI. The Programs page and its dialogs are product UI.

Use `.include()` or `.exclude()` only to omit a noisy third-party widget. Put a comment naming the widget and why its markup is outside the product. Do not use a CSS include such as `section[role="dialog"]` for the New Program or Edit Program dialog.

## Keyboard

Use `ProgramsPage` and role-based locators. The primary control is `programs.newProgramButton` (`+ New Program`). It is in the tab order.

1. Tab until that button is focused. Do not call `focus()` to skip Tab.
2. Assert `await expect(programs.newProgramButton).toBeFocused()`.
3. Press Enter with `programs.pressKey('Enter')`.
4. Assert the New Program dialog is visible with `await expect(new NewProgramModal(page).dialog).toBeVisible()`. Do not call `openNewProgramForm()`. That method clicks the button.

This test has its own single tag. Do not add a second tag.
