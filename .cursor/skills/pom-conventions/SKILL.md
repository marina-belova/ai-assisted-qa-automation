---
name: pom-conventions
description: Page Object Model conventions for Didaxis Playwright tests. Use when adding or refactoring UI tests for programs, login, or modals in this repo.
---

# Page Object Model (Didaxis)

## Use existing Page Objects first

Before adding locators or UI actions in a spec, reuse and extend:

| File | Purpose |
|------|---------|
| `pages/LoginPage.ts` | Login form actions (`auth.setup.ts` and login-page tests only) |
| `pages/ProgramsPage.ts` | Programs list, navigation, create/edit/delete, shared list locators |
| `pages/NewProgramModal.ts` | New Program dialog actions |
| `pages/EditProgramModal.ts` | Edit Program dialog actions |
| `pages/dialog-sync.ts` | Modal layer idle wait (used by modals / edit flow) |
| `pages/program-api.ts` | API response matchers and delete confirmation message text |

Shared helpers: `utils/test-data.ts` (`requireBaseUrl`, `uniqueName`, `uniqueNameSimple`, `nameOfLength`).

Do **not** duplicate page-level actions (login, open create form, submit create/edit, delete) inside specs.

## POM rules

1. **Locators** — `readonly` properties on the class, set in the constructor.
2. **Locator APIs** — Only `getByRole`, `getByLabel`, and `getByText` in Page Objects. No CSS or XPath locators in `pages/`.
3. **Actions** — Methods perform user actions (`goto`, `openNewProgramForm`, `createProgram`, `openEditProgram`, `submitEdit`, etc.).
4. **Assertions** — Never `expect()` inside Page Objects. Specs assert using locators from Page Objects (e.g. `programs.programNameText(name)`, `programs.textInProgramCell(name, description)`).
5. **Specs** — No inline `page.getByRole` / `getByLabel` / `getByText` for flows that belong on a Page Object.

## Authentication

- Use Playwright **`storageState`**: `playwright/.auth/user.json` via the `setup` project and `tests/auth.setup.ts`.
- **Do not** add per-test UI login to DS program specs.
- Login-page-only specs: use empty `storageState` for that project/test.

## API cleanup (where applicable)

Tests that **create** programs and should not leave data behind:

- Import `test` and `expect` from `fixtures/cleanup.fixture.ts` (not `@playwright/test` alone).
- Call `trackProgram(uuid)` immediately after create when the UUID is known.
- See the `api-cleanup` skill.

## Test file naming

**`dsX-[ticket-title].spec.ts`**

Current DS suites:

- `ds1-create-program.spec.ts`
- `ds2-create-program.spec.ts`
- `ds2-edit-program-regression.spec.ts`
- `ds3-program-name-rules.spec.ts`
- `ds4-delete-program.spec.ts`
- `ds5-program-list.spec.ts`

Do not merge DS suites into a generic `programs.spec.ts`.

## Adding new program tests

1. Extend Page Objects if a locator or action is reused.
2. Import `ProgramsPage` (+ modals as needed).
3. `beforeEach`: `goto()` or `gotoAndWaitForProgramsList()`, then assert list ready (e.g. New Program button visible).
4. Credentials only in `.env`; never hardcode secrets in source.
