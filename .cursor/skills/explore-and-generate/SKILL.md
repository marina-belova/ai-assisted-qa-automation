---
name: explore-and-generate
description: >-
  Finds one high-value untested user flow by reading tests/ and exploring the
  target page with Playwright MCP's accessibility tree, then writes a Gherkin
  plan and hands it to test-writer. Use for requests such as "find what we're
  not testing", "explore <page> for untested flows", and "expand coverage".
  This skill must NOT be used when a Jira ticket already exists; use
  jira-ticket-analyzer instead.
---

# Explore and Generate

Find a real gap between the live UI and `tests/`, then turn exactly one uncovered flow into a Gherkin plan. This skill explores and plans. It does not create or modify Playwright tests, and it does not modify application code. Implementation belongs to the test-writer agent.

## Do not use when a Jira ticket exists

If a Jira ticket, issue key, or ticket URL is already in scope, stop. This skill must NOT be used. Use jira-ticket-analyzer instead.

## Workflow

1. Read existing `tests/` to map covered user flows.
2. Explore the target page using Playwright MCP and its accessibility tree, not screenshots or pixel-based inspection.
3. Identify real user flows supported by the UI.
4. Compare discovered flows against existing test coverage.
5. Select exactly ONE highest-value uncovered flow and explain why.
6. Produce a Gherkin test plan containing a positive path and one edge case, with every Then step containing an assertion.
7. Hand the plan to the test-writer agent for implementation.

## Read-only exploration

Exploration must be read-only.

- Use Playwright MCP. Read the page with `browser_snapshot` (the accessibility tree). Do not use `browser_take_screenshot` or any pixel-based inspection.
- Navigate, snapshot, and open a control only to read the roles, names, and states it exposes.
- Do not create, save, edit, delete, upload, or submit anything that changes application data.
- Do not invent selectors, pages, labels, or behavior that the accessibility tree did not show.
- If credentials or the app are unavailable, say exploration was skipped. Do not select a flow and do not write a plan.

The target is the page the user named. If they did not name one, ask before exploring. The app base URL is `DIDAXIS_URL`, default `https://test.didaxis.studio`. Never print or hardcode credentials.

## Coverage map

Read the specs under `tests/`. List the user flows those specs already assert. A skipped test, a comment, or a helper that is never called is not coverage.

From the accessibility tree, list only flows a user can actually start from the controls on the page (open, submit, cancel, validate, navigate). Drop anything the tree did not show.

A flow is uncovered when no existing spec asserts that user outcome.

## One flow

Select exactly ONE highest-value uncovered flow. Prefer a flow a user can finish from this page, that no spec asserts, and whose failure would hide real product behavior.

Before the Gherkin, explain in one short paragraph why this flow outranks the other gaps. Do not propose a second flow.

## Gherkin plan

Write exactly two scenarios:

- One positive path.
- One edge case grounded in the accessibility tree (a disabled control, an empty field, a cancel, or a validation state the tree exposed). Do not invent an edge the UI did not show.

Every `Then` step contains an assertion: an observable result a test can check, such as visible text, an enabled or disabled control, a URL, a dialog open or closed, or list contents. `And` and `But` steps that continue a `Then` also assert. A `Then` that only narrates an action is invalid.

Do not put Playwright locators, selectors, or implementation steps in the plan.

```gherkin
Feature: <uncovered flow>

  Scenario: <positive path>
    Given <state the accessibility tree showed>
    When <user action>
    Then <assertion of the observable result>

  Scenario: <edge case>
    Given <state the accessibility tree showed>
    When <user action>
    Then <assertion of the observable result>
```

## Handoff

Pass the explanation and the Gherkin plan to the test-writer agent for implementation. test-writer writes the spec under `tests/` only.

This skill stops at the plan. It does not create or modify Playwright tests. It does not modify application code.
