---
name: jira-ticket-to-gherkin
description: Reads a Jira ticket, extracts the title and acceptance criteria, and converts the requirements into clear Gherkin scenarios. Use when a Jira story or task needs BDD scenarios or testable acceptance criteria.
---

# Jira Ticket to Gherkin

Convert Jira stories and tasks into concise, testable Gherkin. Source of truth is the ticket—never invent requirements.

## Scope

The skill should:

- Read the specified Jira ticket using Atlassian MCP.
- Extract the ticket title, description, and acceptance criteria.
- Preserve the intended business behavior from Jira.
- Convert the requirements into valid Gherkin using Feature, Scenario, Given, When, Then, And.
- Include positive, negative, and relevant edge-case scenarios when supported by the Jira requirements.
- Do not invent requirements that are not present in Jira.
- Clearly identify any ambiguity or missing acceptance criteria instead of guessing.
- Output concise, testable Gherkin scenarios

## Workflow

### 1. Resolve ticket identifier

Accept any of:

- Issue key (e.g. `DS-3`, `PROJ-123`)
- Full Jira issue URL
- User paste that includes the key

If the user did not specify a ticket, ask for the key or URL before fetching.

### 2. Fetch issue (Atlassian MCP)

1. Call `getAccessibleAtlassianResources` once per session; cache `cloudId` for all later calls.
2. Call `getJiraIssue` with:
   - `cloudId`
   - `issueIdOrKey`
   - `view: "evidence"` (description, acceptance criteria, custom fields)
   - `responseContentFormat: "markdown"` when available

3. If acceptance criteria are empty or not in a dedicated field, parse them from:
   - Description sections (headings like "Acceptance Criteria", "AC", "Scenario")
   - Existing Gherkin blocks in the description
   - Linked Confluence or child issues only when the user asked to include them—do not expand scope silently

### 3. Extract and normalize requirements

Capture and show the user briefly before writing scenarios:

| Item | Source |
|------|--------|
| Feature name | Summary / title (behavior-focused wording) |
| User story | Description (As a… I want… So that…), if present |
| Acceptance criteria | AC field, description sections, or embedded scenarios |
| Out of scope | Anything in ticket that is explicitly deferred or technical-only |

**Mapping rules:**

- One Jira AC scenario → at least one Gherkin `Scenario` (or `Scenario Outline` if the AC defines a table of examples present in Jira).
- Keep actor, field names, and outcomes aligned with Jira wording unless Jira itself is inconsistent—then note the inconsistency under **Ambiguities**.
- Negative and edge cases: add only when Jira implies them (validation rules, error messages, boundaries stated in description/AC). Do not add generic security/load tests unless the ticket mentions them.

### 4. Write Gherkin

Use standard keywords: `Feature`, `Background` (optional), `Scenario`, `Scenario Outline`, `Examples`, `Given`, `When`, `Then`, `And`, `But`.

**Quality bar:**

- Steps describe observable behavior, not implementation.
- Use concrete values from Jira (names, labels, messages)—not `foo` / `test123` unless the ticket uses placeholders.
- Avoid duplicate scenarios that assert the same outcome.
- Prefer 3–8 steps per scenario; split only when Jira describes distinct flows.

### 5. Deliver output

Use this structure in the response:

1. Heading: `# Gherkin: [Ticket key] — [Summary]`
2. Optional **User story** line from Jira
3. **Feature file** — one fenced `gherkin` block with `Feature`, `Scenario`(s), and steps
4. **Traceability** — table mapping each Jira AC/requirement to scenario name(s)
5. **Ambiguities and gaps** — bullets (or `None identified from ticket content.`)

If there are no gaps, write: `None identified from ticket content.`

Optionally save to `Test Cases/<KEY>/<KEY>_gherkin.feature` or `<KEY>_input.md` when the user asks for a file; match existing repo layout under `Test Cases/` when saving.

## Anti-patterns

- Do not add scenarios for UI details, APIs, or rules absent from the ticket.
- Do not “fix” ambiguous ACs by choosing one interpretation—list options under **Ambiguities**.
- Do not output a full manual test plan (TC IDs, priorities, Playwright locators) unless the user explicitly asks; this skill outputs Gherkin only.

## Examples

See [examples.md](examples.md) for a minimal before/after from ticket text to Gherkin.
