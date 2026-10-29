# DS-5 — Program list filtering and display
# User story: As an admin user, I want to see all programs in a clear list so that I can quickly find and manage them.
#
# UI recon (https://test.didaxis.studio/programs):
# - Heading "Programs" and button "+ New Program" are visible.
# - When programs exist, the page shows a table. Name and description are both visible.
# - GET /api/programs returns 200 with data items that include name and description.
# - No search box was present. The empty state was not visible because programs already exist.
#
# Ambiguities:
# - Summary says "filtering", but the acceptance criteria do not define search, filter, or sort.
# - Empty-state message text is not specified.
# - Do not delete programs this test did not create in order to force an empty catalog.
# - Test Cases/DS-5/DS-5_output.md adds cases that are not in the Jira acceptance criteria.

Feature: Program list filtering and display
  As an admin user
  I want to see all programs in a clear list
  So that I can quickly find and manage them

  Scenario: Display program list with key details
    Given programs exist in the system
    When I navigate to the Programs page
    Then I see a list showing each program's name and description

  Scenario: Empty state when no programs exist
    Given no programs exist
    When I navigate to the Programs page
    Then I see a message indicating no programs have been created
    And I see a prompt to create the first program
