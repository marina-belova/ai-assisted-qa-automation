---
name: ci-failure-triage
description: >-
  Triage a failed GitHub Actions E2E run for this Playwright repo. Use when a
  CI build fails, a GitHub Actions run id or Actions URL is given, or the user
  asks to investigate, diagnose, or triage a Playwright CI failure. Pull logs
  and the playwright-report artifact with gh, classify product defect vs
  TEST ISSUE — LOCATOR DRIFT vs other test-code issues vs
  environment/credentials/flaky test, and write a structured report. Do not
  file Jira tickets, post GitHub comments, merge, or push unless the user
  approves.
---

# CI Failure Triage

Diagnose a red **E2E Tests** run. Report in chat. Do not change tests, the workflow, or git unless the user asks for a fix after the report.

## Rules

- Never merge a fix. Never push. Propose the fix; a human applies it. Do not edit the Page Object in this skill. Locator drift is repaired later by [self-heal](../self-heal/SKILL.md), and only after this report uses that classification.
- Never create a Jira ticket unless the user explicitly approves that filing.
- Never post a GitHub comment, review, or commit comment unless the user explicitly approves that post.
- Never print or copy `DIDAXIS_URL`, `DIDAXIS_EMAIL`, `DIDAXIS_PASSWORD`, `DIDAXIS_API_TOKEN`, or any other secret. Logs mask them as `***`. Keep them masked.
- Do not invent missing evidence. If a trace, screenshot, or stack frame is absent, say it is absent.
- Name the cause and the file:line. A symptom ("test failed") is not a diagnosis.

## Resolve the failed run

Use `gh` against the current repository. If `gh` returns Forbidden, rerun with network permission. Do not guess a run id.

1. If the user gave a run id or Actions URL, use that id.
2. Otherwise list recent E2E runs and take the latest failed one:

```bash
gh run list --workflow=e2e.yml --limit 5 --json databaseId,name,status,conclusion,headBranch,headSha,url,displayTitle,createdAt
gh run view <run-id> --json conclusion,status,headSha,headBranch,event,url,jobs
```

The workflow is `.github/workflows/e2e.yml` (**E2E Tests**). The job is `test` on `ubuntu-latest`. It checks out the repo, runs `npm ci`, installs Chromium, then:

```bash
npx playwright test --project=chromium
```

`--project=chromium` also runs the `setup` dependency (`tests/auth.setup.ts`). Firefox and WebKit are not installed and are not part of this job.

3. Save the failed-step log outside the repo:

```bash
mkdir -p /tmp/ci-triage/<run-id>
gh run view <run-id> --log-failed > /tmp/ci-triage/<run-id>/failed.log
```

4. Download the artifact if it exists. The upload step name is `playwright-report`, path `playwright-report/`, kept 7 days, and it runs when the job was not cancelled (`if: ${{ !cancelled() }}`), including on test failure.

```bash
gh api repos/{owner}/{repo}/actions/runs/<run-id>/artifacts
gh run download <run-id> --name playwright-report --dir /tmp/ci-triage/<run-id>/playwright-report
```

If the artifact is missing or expired, say so and triage from the log only.

Do not write the download into the git working tree.

## Read the failure

From the log summary and `playwright-report/data/*.md`:

- Project, spec path, test title, and `file:line` of the failing assertion.
- Expected vs received, timeout, and how many attempts failed. CI sets `retries: 2`, so one failure plus two retries is three attempts. `trace: 'on-first-retry'` means a trace exists only when a retry ran.
- Whether `setup` / `auth.setup.ts` failed before specs ran.
- Skip count is not a failure. Do not treat skipped tests as failed.

This job uploads `playwright-report/` only, not `test-results/`. Evidence in the artifact is:

- `data/*.md` — assertion, received value, and page snapshot
- `data/*.zip` — trace for a retried failure, when Playwright attached one

Unzip a trace under `/tmp/ci-triage/<run-id>/` when the markdown snapshot is not enough to see the DOM, network, or console. If no zip is present, report that no trace was attached.

A Programs accessibility scan must fail when `results.violations` is not empty. `expect(results.violations).toEqual([])` is the required assertion. `expectNoAxeViolations` in `utils/a11y.ts` records violations and lets the test pass when `CI` is set. A green CI job that only warns about axe violations is not an accessibility pass. Report each rule id, impact, and node, then stop. Do not treat that warning as noise, and do not file a Jira bug unless the user approves.

## Cross-reference

Read the current spec at the stack line, then the code it calls.

| Look here | Why |
|-----------|-----|
| `tests/**/*.spec.ts`, `tests/auth.setup.ts` | Failing test and assertion |
| `pages/ProgramsPage.ts`, `pages/NewProgramModal.ts`, `pages/EditProgramModal.ts`, `pages/LoginPage.ts`, `pages/program-api.ts`, `pages/dialog-sync.ts` | Locators and actions. Apply [pom-conventions](../pom-conventions/SKILL.md): assertions stay in specs; POMs use role/label/text locators |
| `fixtures/cleanup.fixture.ts`, `utils/test-data.ts`, `utils/a11y.ts` | Cleanup, generated names, a11y reporting |
| `Test Cases/<KEY>/` | Acceptance criteria when the spec maps to a DS story |
| `playwright.config.ts` | `baseURL` from `DIDAXIS_URL`, `locale: 'en-US'`, `timezoneId: 'America/Los_Angeles'`, Chromium `storageState`, `retries` 2 on CI and 0 locally, `trace: 'on-first-retry'`. `workers` is not set to 1. |

Didaxis application source is not in this repository. Do not invent an application file or line. Cite the test or Page Object line that observed the behavior, plus the DOM evidence from the report. If application source is present in the workspace, cite that file and line too.

If the failure is leftover programs, a delete that did not run, or a 401 on cleanup, read [api-cleanup](../api-cleanup/SKILL.md) before classifying it as a product defect.

## Classify

Pick one primary class. State why in one short paragraph.

| Class | Signals | Next step |
|-------|---------|-----------|
| **Product defect** | The app contradicts the spec or `Test Cases/` AC. The page loaded, auth worked, and the same assertion failed across retries. DOM or network evidence shows the wrong UI or API result. The expected control is absent, not merely renamed. | Recommend a product fix. Draft what a Jira Bug would say. File it with [jira-bug-reporter](../jira-bug-reporter/SKILL.md) only after the user approves. Do not self-heal. |
| **TEST ISSUE — LOCATOR DRIFT** | The locator no longer matches, and the accessibility tree, DOM snapshot, or error context still shows the expected element under its current role and accessible name. The page loaded and auth worked. Use this class only when both the stale locator and the surviving element are in evidence. | Name the Page Object file and line and quote the current role and accessible name. Do not edit the locator here. The parent may run [self-heal](../self-heal/SKILL.md). |
| **Test-code issue** | Wrong expected value, assertion in the wrong place, or the test does not match current POM behavior. Also `waitForTimeout`, `expect(await locator.isVisible()).toBe(true)`, a CSS or XPath locator, or `.first()` on a multi-match. A stale locator whose target element was not shown belongs here or in Unclassified, not in locator drift. | Recommend `toBeVisible()`, `toBeEnabled()`, `toHaveText()`, or `filter({ hasText })`. Keep the assertion's existing meaning. Do not edit files unless the user asks. |
| **Environment / credentials / flaky test** | `setup` cannot authenticate, secrets missing, configuration or project mismatch, target URL unreachable, browser install failed, or the test passed on a later retry with no code change. Shared-catalog collisions and cleanup 401s belong here when the assertion never saw a product bug. | Name the failed step and the env var **name** only. Do not file a product bug. Do not self-heal. |

If the evidence does not fit one row, classify as `Unclassified` and list what is missing. Do not use **TEST ISSUE — LOCATOR DRIFT** as a default. Do not use it when the expected element is absent from the tree and the report.

Checkout, `npm ci`, and `npx playwright install --with-deps chromium` succeeding means the red step is the Playwright command, not the runner image.

## Report

Reply with this structure. Omit a section only when the evidence does not exist, and say what is missing.

```markdown
## CI failure triage

**Run:** [<run-id>](https://github.com/<owner>/<repo>/actions/runs/<run-id>)
**Commit:** `<sha>`
**Workflow:** E2E Tests (`e2e.yml`)
**Result:** <N failed, N skipped, N passed>

### Summary
<one sentence: cause, not "the test failed">

### Classification
TEST ISSUE — LOCATOR DRIFT | Product defect | Test-code issue | Environment / credentials / flaky test | Unclassified

### Failing test
- Spec: `tests/...:<line>`
- Title: `<exact title>`
- Project: chromium

### Expected vs actual
- **Expected:** ...
- **Actual:** ...

### Source location
- **File:** `path:line` — <why this line is the cause>
- Application source: <path:line, or "not in this repository">

### Suggested fix
<concrete change. Do not apply it in this step.>

### Evidence
- Log: <assertion message>
- Report: <data/*.md path or "no markdown error context">
- Trace: <data/*.zip path or "no trace attached">

### Not done
Jira and GitHub comments were not created. Say so.
```

## Related skills

- [pom-conventions](../pom-conventions/SKILL.md) — locator and POM rules when the failure is on the test side
- [api-cleanup](../api-cleanup/SKILL.md) — program create/delete and `DIDAXIS_API_TOKEN` refresh
- [jira-bug-reporter](../jira-bug-reporter/SKILL.md) — Jira Bug only after the user approves a product-defect filing
- [self-heal](../self-heal/SKILL.md) — locator repair only after this report classifies TEST ISSUE — LOCATOR DRIFT
