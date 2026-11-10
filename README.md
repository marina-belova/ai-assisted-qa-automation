# AI-assisted QA automation

Playwright end-to-end tests for Didaxis Studio. Application source is not in this repository.

## Prerequisites

CI uses Node.js 20, `npm ci`, and Chromium. `package-lock.json` is in the repo. `.gitignore` ignores `.env`.

## Install

```bash
npm ci
npx playwright install chromium firefox webkit
```

`npm ci` installs the locked dependencies. `npm test` runs the setup, Chromium, Firefox, and WebKit projects in `playwright.config.ts`. The install command installs those three browsers. Playwright 1.63.0 accepts `chromium`, `firefox`, and `webkit` as `npx playwright install` arguments. The E2E workflow installs Chromium only: `npx playwright install --with-deps chromium`.

## Environment

Copy the example file and replace the placeholders. Do not commit `.env`.

```bash
cp .env.example .env
```

`playwright.config.ts` loads `.env` through dotenv. `DIDAXIS_URL` is `baseURL`. `DIDAXIS_EMAIL` and `DIDAXIS_PASSWORD` are read by `pages/LoginPage.ts` and `tests/auth.setup.ts`. `DIDAXIS_API_TOKEN` is the Bearer token for program cleanup. The setup project writes `playwright/.auth/user.json`, which `.gitignore` also ignores.

`DIDAXIS_ALT_EMAIL` and `DIDAXIS_ALT_PASSWORD` are reserved for permission probes. No current test reads them.

`CURSOR_API_KEY`, `ATLASSIAN_API_TOKEN`, `ATLASSIAN_BASE_URL`, and `ATLASSIAN_EMAIL` are not needed for `npx playwright test`. The test-generation workflow reads them from GitHub secrets. Put the Atlassian values in Cursor's MCP settings when using Jira from the editor.

## Run tests

```bash
npm test
```

`npm test` runs `playwright test` for every project in `playwright.config.ts`: setup, Chromium, Firefox, and WebKit.

The E2E workflow runs Chromium only:

```bash
npx playwright test --project=chromium
```

## Tagged slice

```bash
npm run test:smoke
npm run test:sanity
npm run test:regression
npm run test:api
npm run test:e2e
npm run test:destructive
```

Each script runs `playwright test --grep` with one approved tag: `@smoke`, `@sanity`, `@regression`, `@api`, `@e2e`, or `@destructive`. Playwright 1.63.0 matches `--grep` against the test title path with the test's tags appended. No `--project` is set, so each script uses every project in `playwright.config.ts`, the same set as `npm test`.

`test:destructive` adds `--workers=1`. The other five scripts do not set a worker count.

The Chromium, Firefox, and WebKit projects depend on the setup project. A grep that matches a browser test also lists `authenticate` in `tests/auth.setup.ts`. That test is tagged `@smoke`.

`@api`, `@e2e`, and `@destructive` are approved tags, and no current test uses them. `npm run test:api`, `npm run test:e2e`, and `npm run test:destructive` discover no tests, and Playwright reports `No tests found`. A test is not added only to give one of those scripts something to run.

## Cursor agents and skills

Project rules live in `.cursor/rules/`. `constitution.mdc` and `qa-orchestration.mdc` are always applied. `playwright-conventions.mdc` applies to `tests/**`.

Skills in `.cursor/skills/`: a11y-checks, api-cleanup, ci-failure-triage, explore-and-generate, exploratory-charter, jira-bug-reporter, jira-ticket-to-gherkin, network-mocking, pom-conventions, and self-heal.

Agents in `.cursor/agents/`: bug-reporter, test-writer, and triage.

`qa-orchestration.mdc` routes a Jira ticket to a test plan, a plan to test-writer, a failure to triage, locator drift to self-heal, and a confirmed product defect to bug-reporter after human approval. No separate install command exists for these files.
