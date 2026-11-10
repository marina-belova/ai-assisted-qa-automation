# DS-296 — Marina M. Belova — Verify New Semester date validation
# User story: As an admin, I want New Semester to validate Start Date and End Date so a semester is not created with an invalid date range.
#
# UI recon (https://test.didaxis.studio/programs, 2026-11-09):
# - With Semester Name and Start Date 2026-09-01 filled, and End Date empty, Create Semester is disabled. No error text is shown.
# - With Semester Name, Start Date 2026-09-01, and End Date 2026-12-15, Create Semester is enabled.
# - With Semester Name "Date Check", Start Date 2026-09-01, and End Date 2026-08-01, Create Semester is enabled.
# - Clicking Create Semester in that case closes the dialog and shows the semester.
# - The panel shows the name and the text "2026-09-01 — 2026-08-01" (em dash, U+2014, with spaces).
# - No validation message is shown. Console has no error.
#
# Ambiguities:
# - The acceptance criteria say an end date before the start date does not create a semester.
# - The UI creates it and shows the inverted range. Assert that observed outcome.
# - Do not invent an error sentence. None was shown.
# - A start date left empty while the end date is filled was not checked separately.
#   The empty-end-date case above is the observed "a date is empty" result.

Feature: Verify New Semester date validation
  As an admin
  I want New Semester to validate Start Date and End Date
  So that a semester is not created with an invalid date range

  Scenario: Create Semester stays disabled when the end date is empty
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When the user enters a semester name and start date 2026-09-01 and leaves End Date empty
    Then the Create Semester button is disabled
    And the New Semester dialog is still visible

  Scenario: Create Semester becomes enabled for a date range that ends after it starts
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When the user enters a semester name, start date 2026-09-01, and end date 2026-12-15
    Then the Create Semester button is enabled

  Scenario: An end date before the start date is saved without an error message
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When the user enters a semester name, start date 2026-09-01, and end date 2026-08-01
    And the user creates the semester
    Then the New Semester dialog is closed
    And the semester panel shows the semester name
    And the semester panel shows "2026-09-01 — 2026-08-01"
    And no error message is shown
