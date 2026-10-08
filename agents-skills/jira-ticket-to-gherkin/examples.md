# Examples

## Input (excerpt from Jira description)

**Summary:** Program name validation and duplicate prevention

**Acceptance criteria:**

```
Scenario: Reject program name with only whitespace
  Given I am on the program creation form
  When I enter "   " as the program name
  And I click Create
  Then the form is not submitted (name is trimmed, treated as empty)
```

## Output (Gherkin only)

```gherkin
Feature: Program name validation and duplicate prevention

  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " as the program name
    And I click Create
    Then the form is not submitted
    And the program name is treated as empty after trimming

  Scenario: Reject duplicate program name
    Given a program "Web Development 2026" already exists
    When I try to create a new program with the name "Web Development 2026"
    Then I see an error indicating the name already exists
```

## Ambiguities example

If Jira says “click the edit icon” but no icon vs button is specified:

```markdown
## Ambiguities and gaps

- AC "Open program for editing" refers to an "edit icon"; ticket does not specify accessible name, tooltip, or row action pattern.
```

Do not add steps that assume a specific control type unless the ticket defines it.
