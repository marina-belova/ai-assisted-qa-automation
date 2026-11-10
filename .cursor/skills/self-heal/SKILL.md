---
name: self-heal
description: >-
  Heal a Playwright suite after a locator drifts. Use when the user says
  "the build is red because a locator broke", "fix the drifted selector",
  "the test broke after a UI change", or "heal the suite". Run only after
  triage classifies the failure as TEST ISSUE — LOCATOR DRIFT. Never heal a
  real application bug, an environment or configuration failure, or an
  unclassified failure.
---

# Self-heal

Repair one drifted Page Object locator. Stop if the checks below are not all true. One locator per execution.

## Step 1 — Require triage

Read the triage report before editing.

Proceed only when the report's classification is exactly:

`TEST ISSUE — LOCATOR DRIFT`

If the report has no classification, stop and invoke triage (`.cursor/skills/ci-failure-triage/SKILL.md` and `.cursor/agents/triage.md`). Do not edit while waiting for that report.

Do not heal when the classification is missing, `Unclassified`, **Product defect**, **Test-code issue**, or **Environment / credentials / flaky test**. Configuration failures and credential failures use the environment class. They are not locator drift.

A product defect goes to `.cursor/skills/jira-bug-reporter/SKILL.md`. Do not create a Jira issue unless a human explicitly approves that filing.

## Step 2 — Identify the broken locator

From the failed test, the Playwright error, and the trace or report:

- Spec path and the exact test title
- The failing locator expression
- The Page Object file and line that defines it
- The locator text before any edit

Record that original locator. If the report does not name one locator, stop.

## Step 3 — Rediscover the element

Use Playwright MCP `browser_snapshot` on the live page and read the accessibility tree.

Quote the element's role and its current accessible name from that tree. That quote is the evidence for the replacement.

Do not guess the name. Do not take it from a screenshot. Do not use CSS or XPath. Do not invent a `data-testid`.

If `browser_snapshot` is unavailable, stop and say the tree was not read. If the expected element is absent from the tree, stop and escalate. Absence is not locator drift.

## Step 4 — Apply a minimal repair

Change only the drifted locator in that Page Object.

Keep the Page Object's structure, actions, and other locators. Do not edit application source. Do not edit `tests/`. Do not change assertions, expected values, tags, or test data. Do not skip, delete, or comment out a test. Do not add `waitForTimeout`, `page.locator()`, or a TypeScript `any`.

Follow `.cursor/rules/playwright-conventions.mdc`, including **Refusals (hard stops)**.

## Step 5 — Prove the repair

Run the exact failed test, not the whole suite:

```bash
npx playwright test <spec> -g "<exact title>" --project=chromium
```

Healing is successful only when that command exits 0.

Also require an empty spec diff against the commit that failed:

```bash
git diff --exit-code <failed-sha> -- tests/
```

`.cursor/hooks/heal-gate.sh` can reject a `tests/` edit that deletes or comments out an `expect(`. It does not prove the assertions are the same. An equal number of `expect(` calls can still hide a weaker matcher, such as `toBeVisible()` replaced with `toBeHidden()`. The empty `tests/` diff is the check that counts.

If the rerun fails, or `tests/` changed, stop. Do not claim success. Do not open a repair pull request.

## Step 6 — Report and open a pull request

Report all of these:

- Original CI run
- Triage classification
- Exact test title and spec path
- Page Object file
- Old locator
- New locator
- Accessibility-tree evidence (role and accessible name)
- Playwright rerun result
- Confirmation that `tests/` is unchanged

Open one repair pull request only after the rerun is green, the `tests/` diff is empty, and the classification is `TEST ISSUE — LOCATOR DRIFT`. Link the failed run in the pull request body.

A human reviews that pull request. Do not merge it.

When a GitHub Actions job runs this skill, that job repeats the test command and `git diff --exit-code <failed-sha> -- tests/` before it pushes or opens the pull request. The agent's own claim is not the proof.
