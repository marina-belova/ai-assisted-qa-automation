# DS-295 — Marina M. Belova — Validate New Semester required fields
# User story: As an admin, I want the New Semester dialog to require a name and both dates before a semester can be created.
#
# UI recon (https://test.didaxis.studio/programs, 2026-11-09):
# - Selecting a program shows heading level 4 with the program name, "Semesters & scheduling config", and "+ Semester".
# - A program with no semesters shows "No semesters yet".
# - "+ Semester" opens a dialog headed "New Semester".
# - Required fields shown: Semester Name, Start Date, End Date.
# - With those three fields empty, Create Semester is disabled.
# - With only Semester Name filled, Create Semester stays disabled and the dialog stays open.
# - With Semester Name, Start Date 2026-09-01, and End Date 2026-12-15, Create Semester is enabled.
# - Do not click Create Semester in these scenarios.

Feature: Validate New Semester required fields
  As an admin
  I want the New Semester dialog to require a name and both dates
  So that a semester cannot be created until those fields are filled

  Scenario: Create Semester is disabled when the required fields are empty
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When Semester Name, Start Date, and End Date are empty
    Then the Create Semester button is disabled

  Scenario: Create Semester stays disabled when only the semester name is entered
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When the user enters a semester name and leaves Start Date and End Date empty
    Then the Create Semester button is disabled
    And the New Semester dialog is still visible

  Scenario: Create Semester becomes enabled when the name and both dates are filled
    Given a program with no semesters is selected
    And the New Semester dialog is open
    When the user enters a semester name, start date 2026-09-01, and end date 2026-12-15
    Then the Create Semester button is enabled
