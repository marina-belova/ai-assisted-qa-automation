# DS-4 — Delete program with confirmation
# User story: As an admin user, I want to delete a program I no longer need, with a confirmation step to prevent accidental deletion.
#
# UI recon (https://test.didaxis.studio/programs), using a program created for this check and then deleted:
# - The delete control is a button named "Delete <program name>".
# - Clicking it opens a browser confirm dialog, not an in-app dialog.
# - Dialog message: Delete program "<name>"? All its semesters and courses will be removed. This cannot be undone.
# - Dismissing the dialog leaves the program in the list.
# - The message does not contain the word Cancel. Cancel is the browser dialog's dismiss button.
#
# Ambiguities:
# - Jira says "click Cancel" and does not say whether the dialog is the browser confirm or an in-app dialog.
# - Jira does not specify the confirmation message text.
# - The example name "Test Program" is not unique. A test must create its own program and must not delete any other program.
# - Test Cases/DS-4/DS-4_output.md adds cases that are not in the Jira acceptance criteria.

Feature: Delete program with confirmation
  As an admin user
  I want to delete a program I no longer need
  So that a confirmation step prevents accidental deletion

  Scenario: Delete program with confirmation
    Given a program "Test Program" exists
    When I click the delete icon for "Test Program"
    Then I see a confirmation dialog
    When I confirm deletion
    Then "Test Program" is removed from the program list

  Scenario: Cancel program deletion
    Given I click the delete icon for a program
    When I see the confirmation dialog
    And I click Cancel
    Then the program still exists in the list
