# Jira bug description template

Use markdown in `createJiraIssue` → `description`. Replace placeholders; remove sections that do not apply.

```markdown
## Summary
[One sentence: what is broken from the user/admin perspective]

## Environment
- **Application URL:** [hostname from DIDAXIS_URL, e.g. https://test.didaxis.studio]
- **Browser / project:** [e.g. chromium from Playwright]
- **Date observed:** [ISO date]
- **Branch / CI:** [if known; no secrets]

## Preconditions
- [e.g. Admin user logged in]
- [Required data state]

## Steps to reproduce
1. ...
2. ...
3. ...

## Expected result
[From Jira AC or test plan]

## Actual result
[What happened, including visible errors]

## Affected coverage
- **Source story:** [DS-N]
- **Test plan:** [Test Cases/DS-N/DS-N_output.md — section or TC-ID if known]
- **Playwright test:** `[test title from describe/test]`
- **Source file:** `[repo-relative path, e.g. tests/ds3-program-name.spec.ts:142]`

## Evidence
- **Assertion / error:** `[paste redacted message]`
- **Artifacts:** [screenshot.png attached | trace.zip attached | playwright-report path locally]
- **Related app area:** [page URL path if relevant]

## Notes
- [Optional: flakiness ruled out, repro rate, related defects]
```

## Title patterns

Good:

- `Duplicate program name allowed on create — no validation error (DS-3)`
- `Edit Program modal does not close after successful save`

Avoid:

- `Playwright test failed`
- `TC-007 failed on CI`
