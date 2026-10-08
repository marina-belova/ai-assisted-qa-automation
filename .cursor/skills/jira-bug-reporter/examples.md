# Triage examples

## Product bug → file Jira

**Signal:** Test expects error alert on duplicate create per DS-3 AC; manual repro shows second program row with same name, no error.

**Action:** Create `Bug` in project `DS`, link to `DS-3` with **Defect**, attach screenshot from `test-results/.../test-failed-1.png`.

## Test bug → no Jira

**Signal:** Locator `getByRole('button', { name: 'Edit' })` matches 200 buttons; failure is strict mode violation. UI uses `Edit {programName}`.

**Action:** Tell user to fix locator in `tests/ds2-create-program.spec.ts`; do not file product bug.

## Environment → no Jira

**Signal:** `net::ERR_CONNECTION_REFUSED` to host; all tests fail at `page.goto`.

**Action:** Check `DIDAXIS_URL` and service availability; do not file app bug.

## Insufficient evidence → no Jira

**Signal:** User says "test failed yesterday" with no log, story key, or artifact.

**Action:** List missing: test name, file path, error output, screenshot/trace, story key.

## Secrets redaction

**Bad (never in Jira):** `Logged in as marina@example.com / s3cr3t`

**Good:** `Logged in as admin user (credentials from team vault / .env locally)`
