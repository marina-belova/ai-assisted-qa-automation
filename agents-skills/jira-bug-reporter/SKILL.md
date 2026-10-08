---
name: jira-bug-reporter
description: Analyzes Playwright test failures, identifies root cause, and creates detailed Jira bug tickets. Use when a test fails and needs investigation and bug reporting.
---

# Jira Bug Reporter

Investigate Playwright failures, classify root cause, and file Jira bugs only when the evidence supports a product defect. Never put secrets in Jira.

## Scope

The skill should:

- Analyze a Playwright test failure and determine the likely root cause.
- Distinguish between a product bug, test bug, environment issue, test-data issue, or flaky behavior.
- Create a Jira Bug linked to the original Jira ticket when the failure is confirmed as a product defect.
- The bug report must include:
  - clear title
  - environment
  - preconditions
  - steps to reproduce
  - expected result
  - actual result
  - affected test case / Playwright test
  - source test file path
  - evidence from the failure
- Attach screenshots or other failure evidence to Jira when available.
- Include the path to the relevant source code or failed test.
- Do not create a Jira bug when the evidence is insufficient; instead report what is missing.
- Do not include credentials, tokens, passwords, or secrets in the Jira ticket.

## Workflow

### 1. Collect failure context

Gather from the user message, terminal output, CI logs, or by re-running locally:

| Source | What to extract |
|--------|-----------------|
| Playwright output | Failing test title, file:line, assertion/error message, timeout, browser project |
| Stack trace | Application vs test code frame |
| Artifacts | `test-results/`, `playwright-report/`, trace (`trace.zip`), screenshot, video |
| Test file header | Linked Jira key (e.g. `DS-3`), test plan path under `Test Cases/` |
| Config / env | `playwright.config.ts`, `DIDAXIS_URL` host only (never email/password) |

Read the failing test and the steps around the assertion. If a test plan exists for the story, compare expected vs actual to the documented AC.

### 2. Classify root cause

Choose one primary classification and state why in one short paragraph:

| Classification | Typical signals |
|----------------|-----------------|
| **Product bug** | App behavior contradicts AC/test plan; stable repro; assertion on UI/API state fails consistently |
| **Test bug** | Wrong locator, stale assumption, incorrect expected value, missing wait, test order dependency |
| **Environment** | Target URL down, auth/session broken, network/DNS, wrong env var name (not invalid creds in ticket) |
| **Test data** | Missing seed data, collision with parallel run, data deleted by another test |
| **Flaky** | Passes on retry without code/data change; timing/race; inconsistent across browsers only |

If uncertain between product bug and test bug, re-run the single test once (`npx playwright test <file> -g "<title>"`) before filing.

**Do not create a Jira bug** unless classification is **product bug** with enough evidence (see §5).

### 3. Check for duplicate bugs

Before creating an issue:

1. `getAccessibleAtlassianResources` → cache `cloudId`.
2. `searchJiraIssuesUsingJql` in the same project for open bugs with similar summary or the story key in links/description.
3. If a duplicate exists, add a comment via `addOrEditJiraIssueComment` with new evidence and stop—do not create another bug.

### 4. Create bug (product defect only)

1. Derive **project key** from the source story (e.g. `DS-3` → `DS`).
2. `createJiraIssue`:
   - `issueType`: `Bug` (confirm with `listJiraProjectIssueTypesMetadata` if create fails)
   - `summary`: concise, behavior-focused (not "test failed")
   - `description`: markdown using the template in [reference.md](reference.md)
   - `labels`: include `playwright` and source story key when helpful (e.g. `DS-3`)
3. **Link to source story** using the project’s defect link type:
   - `listJiraIssueLinkTypes` and inspect an existing story→bug link on the same project (e.g. `getJiraIssue` on the story with `view: evidence`).
   - This repo commonly uses link type **Defect** (mirror inward/outward direction from an existing link).
   - `executeWrite` → `createJiraIssueLink` with `cloudId`, `linkType`, `inwardIssue`, `outwardIssue`.
4. Optional: `createJiraIssueRemoteIssueLink` for CI run URL or Playwright report path (file:// paths are not useful—prefer uploaded artifacts or CI link).

### 5. Attach evidence

When screenshot, video, trace, or log files exist locally:

1. `executeWrite` → `uploadAttachmentToJiraIssue` with `filePath` only → run returned `uploadCommand` in shell.
2. Call again with `fileId` to attach to the new bug key.

Prefer PNG/screenshot and short text excerpts over huge traces; attach trace zip only when it clearly shows the defect.

Redact secrets from any pasted log before attachment or description.

### 6. When not to file

Reply to the user with:

- **Classification** (non–product-bug)
- **Reasoning** and suggested fix (test fix, env check, quarantine flaky test, etc.)
- **Missing evidence** list if product bug suspected but unproven (e.g. no screenshot, cannot repro, story key unknown)

Do not call `createJiraIssue`.

### 7. Report back

After filing (or declining), summarize:

- Bug key and URL
- Link to source story
- Classification rationale
- Attachments added
- Recommended next step (dev fix, test update, rerun in CI)

## Repo conventions

- Tests live under `tests/`; story traceability in file comments and `Test Cases/<KEY>/`.
- Base URL comes from `DIDAXIS_URL` in `.env`—cite hostname/path only in Jira.
- HTML report: `npx playwright show-report` after a run; artifacts under `test-results/`.

## Anti-patterns

- Do not paste `.env` values, passwords, tokens, or full auth headers into Jira.
- Do not file bugs for assertion messages alone without expected vs actual behavior.
- Do not duplicate an existing open bug for the same defect.
- Do not link unrelated stories.

## Additional resources

- Bug description template: [reference.md](reference.md)
- Example triage outcomes: [examples.md](examples.md)
