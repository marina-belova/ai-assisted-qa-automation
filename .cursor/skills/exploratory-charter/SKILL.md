---
name: exploratory-charter
description: >-
  Turns a feature and its risks into an exploratory testing charter and a
  blank findings template. Use when asked for an exploratory charter, a
  risk-based test session, or a findings template. The tester decides what
  to try and what was observed. This skill only keeps the format.
---

# Exploratory charter

The tester supplies the feature and the risks. Write a charter the tester can follow, then a blank findings template. Do not explore the product, run tests, or fill in results. Suggestions are not evidence. Do not invent a finding, a defect, a screenshot, a log, or a pass/fail result.

If the feature or the risks are missing, ask. If the timebox is missing, ask. Do not choose a duration.

## Charter

```markdown
# Exploratory charter: <feature>

**Mission.** <One sentence: what the tester is trying to learn about this feature.>

**Scope.**
- In: <the feature and the paths the tester named>
- Out: <what this session will not cover>

**Timebox.** <duration the tester supplied>

**Risk areas.**
- <each supplied risk, one line, with why it matters to this feature>

**Test ideas.**
- <short prompts tied to a named risk. These are suggestions for the tester, not steps that were executed.>

**Test data.**
- <data the tester named, or data already defined for this feature>
- Do not invent credentials, tokens, URLs, or records.
```

Keep the charter focused on the supplied risks. Do not add a risk the tester did not name.

## Findings template

Leave every field empty. The tester fills it in after the session.

```markdown
# Findings: <feature>

These fields record what the tester actually did. They are not the charter's suggestions.

## Observations
-

## Defects
-

## Evidence
-

## Follow-up questions
-
```

A defect entry needs what the tester saw, where, and the evidence they captured. If they did not capture evidence, leave Evidence empty and say so in Follow-up questions. Do not file a Jira bug from this template unless a human asks.
