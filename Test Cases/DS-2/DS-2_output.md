# Test Plan: Edit Existing Program Details (DS-2)

**Feature:** Edit existing program details  
**Ticket:** DS-2  
**User story:** As an admin user, I want to edit an existing program's details so that I can correct or update program information after creation.

## Jira Acceptance Criteria Mapping

| Jira scenario | Test case |
|---------------|-----------|
| Open program for editing | TC-001 |
| Successfully edit a program name | TC-002 |
| Edit preserves unchanged fields | TC-003 |

**Note:** Jira ACs refer to the name field as **Name**; the Didaxis Studio UI labels this field **Program Name**. Steps below use the Jira wording where they trace directly to an AC; expected results call out the UI label where relevant.

## UI Inspection Notes (Playwright MCP — Didaxis Studio)

Verified on `https://test.didaxis.studio/programs` (admin session):

| Element | Verified locator / behavior |
|---------|----------------------------|
| Programs page | URL `/programs`; heading **Programs**; subtitle *Manage academic programs and semesters* |
| New Program | `getByRole('button', { name: '+ New Program', exact: true })` |
| Program list | Single visible column header **Program**; each row cell shows **name** and **description** as separate paragraphs |
| Edit control | `getByRole('button', { name: 'Edit {programName}', exact: true })` — not a standalone icon (Jira AC says "edit icon") |
| Delete control | `getByRole('button', { name: 'Delete {programName}', exact: true })` |
| Edit dialog | `getByRole('dialog', { name: 'Edit Program' })` |
| Program Name field | `dialog.getByLabel('Program Name')` — required (`*`) |
| Description field | `dialog.getByLabel('Description')` — optional |
| Save | `dialog.getByRole('button', { name: 'Save' })` |
| Cancel | `dialog.getByRole('button', { name: 'Cancel' })` |
| Close (X) | Banner button with no accessible name — prefer **Cancel** for dismiss tests |
| Additional fields | Edit dialog also exposes **Show AI Generation Config** (Total Program Hours, Default Session/Hours, Target Audience, Focus Areas, Sync/Async Ratio) — not in DS-2 Jira ACs |
| Save on open | Save is **enabled** when the edit dialog opens, even with no changes |
| Empty / whitespace name | Clearing Program Name or entering only spaces **disables** Save |
| Rename save | Modal closes; list updates in place without full page reload |
| Description-only save | Program Name unchanged; updated description appears as the second paragraph in the list row |
| Duplicate rename | Save succeeds; duplicate names can coexist in the list (no error alert) |
| Scale | Programs list is very large (thousands of rows), which slows DOM queries and create/edit setup |

---

## Positive Flows

### TC-001: Edit form opens pre-populated with current program data

**Covers AC:** Open program for editing  
**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" exists with description "Full-stack web development program".

**Steps:**
1. Given I am on the Programs page
2. And a program "Web Development 2026" exists
3. When I click the edit icon on "Web Development 2026"
4. Then I see the edit form pre-populated with the program's current data

**Expected result:** **Edit Program** modal opens with Program Name showing "Web Development 2026" and Description showing "Full-stack web development program". Save and Cancel are visible. In the UI, the edit action is a button named `Edit Web Development 2026` (Jira AC wording: "edit icon").

---

### TC-002: Program name is updated and reflected immediately in the list

**Covers AC:** Successfully edit a program name  
**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists on the Programs page.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I change the Name to "Web Development 2026 - Updated"
3. And I click Save
4. Then the modal closes
5. And the program list immediately shows "Web Development 2026 - Updated"

**Expected result:** The modal closes without a full page reload. The list row shows "Web Development 2026 - Updated" as the first paragraph in the **Program** column; the old exact name is no longer displayed.

---

### TC-003: Unchanged fields are preserved when only Description is edited

**Covers AC:** Edit preserves unchanged fields  
**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists with description "Full-stack web development program".

**Steps:**
1. Given I am editing a program
2. When I only change the Description
3. And I click Save
4. Then the Name and other fields remain unchanged

**Expected result:** Program Name remains "Web Development 2026". Only the Description is updated — visible as the second paragraph in the list row and on reopening the edit form. (A concrete replacement description such as "Updated full-stack curriculum for 2026" may be used during execution to verify the change.)

---

### TC-004: Both Name and Description can be updated in a single edit

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Mobile Development 2026" exists with description "iOS and Android development".

**Steps:**
1. Given I am editing "Mobile Development 2026"
2. When I change the Name to "Mobile Development 2026 - Advanced"
3. And I change the Description to "Advanced iOS and Android development track"
4. And I click Save
5. Then the modal closes
6. And the program list shows "Mobile Development 2026 - Advanced" with the updated description

**Expected result:** Both fields are saved and displayed correctly in the program list.

---

### TC-005: Save button is enabled when valid changes are made

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User has opened the edit form for an existing program.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I change the Description to "Revised curriculum"
3. Then the Save button is enabled

**Expected result:** Save button is clickable after a valid change is made to at least one field.

---

## Negative Flows

### TC-006: Program is not updated when user cancels the edit form

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists with original description.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I change the Name to "Should Not Save"
3. And I click Cancel
4. Then the modal closes
5. And the program list still shows "Web Development 2026"

**Expected result:** No changes are persisted; original program data remains intact.

---

### TC-007: Empty program name prevents save

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is editing an existing program.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I clear the Name field completely
3. Then the Save button is disabled
4. And the form is not submitted

**Expected result:** Save is blocked; program name cannot be cleared; original data is preserved.

---

### TC-008: Duplicate program name is rejected on edit

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Programs "Web Development 2026" and "Data Science 2026" both exist.

**Steps:**
1. Given I am editing "Data Science 2026"
2. When I change the Name to "Web Development 2026"
3. And I click Save
4. Then I see an error indicating the name already exists
5. And the program is not updated

**Expected result:** Duplicate name error is shown; "Data Science 2026" retains its original name.

> **Scope note:** Duplicate prevention is not stated in DS-2 Jira ACs (see DS-3 for create-time duplicate rules). This case extends coverage for rename collisions and is retained as a negative flow.

---

### TC-009: Non-admin user cannot edit programs

**Priority:** High

**Preconditions:**
- Non-admin user is logged in.
- Program "Web Development 2026" exists on the Programs page.

**Steps:**
1. Given I am logged in as a non-admin user
2. And I am on the Programs page
3. When I view the program "Web Development 2026"
4. Then I do not see an Edit button for the program
5. And I cannot open the edit form

**Expected result:** Edit functionality is unavailable to non-admin users.

---

### TC-010: No update occurs when Save is clicked without any changes

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- User has opened the edit form without modifying any fields.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I do not change any field values
3. And I click Save
4. Then the modal closes
5. And the program list shows unchanged data for "Web Development 2026"

**Expected result:** No erroneous update or error; program data remains the same. **Observed UI:** Save is enabled even when no fields were changed; clicking Save closes the modal without altering data.

---

## Edge Cases

### TC-011: Program name with special characters is accepted on edit

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Basic Programming" exists.

**Steps:**
1. Given I am editing "Basic Programming"
2. When I change the Name to "Informatique & IA - Niveau 2"
3. And I click Save
4. Then the modal closes
5. And the program list shows "Informatique & IA - Niveau 2"

**Expected result:** Special characters in the updated name are saved and displayed correctly.

---

### TC-012: Program name with only whitespace is rejected on edit

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is editing an existing program.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I change the Name to "   "
3. Then the Save button is disabled
4. And the form is not submitted

**Expected result:** Whitespace-only name is trimmed and treated as empty; save is blocked.

---

### TC-013: Program name at maximum allowed length is accepted on edit

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Short Name" exists.
- Maximum name length is 255 characters.

**Steps:**
1. Given I am editing "Short Name"
2. When I change the Name to a 255-character string
3. And I click Save
4. Then the modal closes
5. And the program list shows the updated 255-character name

**Expected result:** Update succeeds at the maximum allowed name length.

---

### TC-014: Program name exceeding maximum length is rejected on edit

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is editing an existing program.
- Maximum name length is 255 characters.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I change the Name to a 256-character string
3. And I click Save
4. Then I see a validation error for the Name field
5. And the program is not updated

**Expected result:** Validation error prevents save; original name is preserved.

> **Scope note:** Max-length limits are not specified in DS-2 Jira ACs. The 255-character boundary follows DS-1 create-form conventions and is retained as an edge case.

---

### TC-015: Description can be cleared to empty on edit

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" has a non-empty description.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I clear the Description field completely
3. And I click Save
4. Then the modal closes
5. And the program list shows "Web Development 2026" with an empty description

**Expected result:** Description is cleared successfully; name remains unchanged.

---

### TC-016: Concurrent edit by two admins shows appropriate conflict handling

**Priority:** Low

**Preconditions:**
- Two admin sessions (Admin A and Admin B) are logged in.
- Program "Web Development 2026" exists.

**Steps:**
1. Given Admin A is editing "Web Development 2026"
2. And Admin B edits and saves "Web Development 2026" with Name "Changed by Admin B"
3. When Admin A clicks Save with Name "Changed by Admin A"
4. Then Admin A sees a conflict or stale-data error
5. And the program reflects the correct final state without data corruption

**Expected result:** System handles concurrent edits gracefully (last-write-wins, optimistic locking, or conflict message).

---

## Comparison with Jira (DS-2)

### Aligned with Jira

| Area | Jira | Test plan |
|------|------|-----------|
| Title | Edit existing program details | Matches |
| AC: open edit form | Pre-populated form after clicking edit control (`Edit {name}` button in UI) | TC-001 |
| AC: rename program | Save closes modal; list updates immediately | TC-002 |
| AC: partial edit | Description-only edit preserves Name and other fields | TC-003 |

### Gaps in Jira ACs (covered by extended test cases)

1. **Admin login:** Not stated in the open-form AC; assumed as a precondition for all scenarios.
2. **Field label:** Jira uses **Name**; UI uses **Program Name** — documented above, not a functional mismatch.
3. **Edit control type:** Jira AC says "edit icon"; UI exposes a named **Edit {programName}** button — functionally equivalent, different locator.
4. **List layout:** Jira AC references the program list but not that description is shown inline in the **Program** column — verified during TC-002/TC-003.
5. **Extra edit fields:** AI Generation Config fields appear in the edit modal but are not mentioned in DS-2 ACs.
6. **Cancel/dismiss:** No AC for Cancel, Escape, or overlay click — covered by TC-006.
7. **Save button state:** No AC for enabled/disabled rules — covered by TC-005, TC-007, TC-010, TC-012.
8. **Duplicate name on edit:** Not in DS-2 ACs — covered by TC-008 (see also DS-3 for create-time rules).
9. **Description required on edit:** AC does not say whether Description can be cleared — covered by TC-015.
10. **Non-admin access:** No role-based AC — covered by TC-009.
11. **Max-length validation:** No limits in DS-2 ACs — covered by TC-013, TC-014 (inferred from DS-1).
12. **Concurrent editing:** No multi-user guidance — covered by TC-016.
13. **Combined field edit:** No AC for updating both fields at once — covered by TC-004.
14. **Special characters:** Not in DS-2 ACs — covered by TC-011.
15. **Large program list / performance:** No AC for setup time with thousands of existing programs — affects automation reliability.
16. **Failed save / list refresh:** AC says list updates "immediately" but does not define behavior on API failure — not yet covered.

### Known application discrepancies (observed vs. expected)

These do not change Jira AC expectations; they document gaps found during QA automation:

| Test case | Expected (test plan) | Observed behavior |
|-----------|----------------------|-------------------|
| TC-008 | Duplicate name rejected on edit | Rename to an existing name succeeds; a second list row with the same name appears; no error alert |
| TC-014 | 256-character name rejected | Program Name has no enforced max length on edit |
| TC-010 | Save disabled until a change is made (optional) | Save is enabled on dialog open even with no edits |
| TC-009 | Non-admin cannot edit | Only an admin account is configured for automation |
| TC-016 | Concurrent edit handling | Only one admin account is configured for automation |
| Setup (all cases) | Programs page loads quickly | Very large program list slows row lookup and create/edit setup |
