# Test Plan: Edit Existing Program Details (DS-2)

**Feature:** Edit existing program details  
**Ticket:** DS-2

---

## Positive Flows

### TC-001: Edit form opens pre-populated with current program data

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" exists with description "Full-stack web development program".

**Steps:**
1. Given I am on the Programs page
2. And a program "Web Development 2026" exists
3. When I click the edit icon on "Web Development 2026"
4. Then I see the edit form pre-populated with the program's current data

**Expected result:** Edit modal opens with Name field showing "Web Development 2026" and Description field showing "Full-stack web development program".

---

### TC-002: Program name is updated and reflected immediately in the list

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

**Expected result:** Updated name appears in the list without page refresh; old name "Web Development 2026" is no longer displayed.

---

### TC-003: Unchanged fields are preserved when only Description is edited

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists with description "Full-stack web development program".

**Steps:**
1. Given I am editing a program
2. When I only change the Description to "Updated full-stack curriculum for 2026"
3. And I click Save
4. Then the Name and other fields remain unchanged

**Expected result:** Program name remains "Web Development 2026"; only the description is updated in the list and backend.

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
4. Then I do not see an edit icon
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

**Expected result:** No erroneous update or error; program data remains the same (or Save is disabled until a change is made).

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

## Ambiguities and Gaps in the Acceptance Criteria

1. **Field label inconsistency:** Creation form uses "Program Name" (DS-1) while edit form uses "Name" (DS-2) — unclear if labels differ or it is the same field.
2. **Save button state:** No AC specifies when Save is enabled/disabled (e.g., no changes, invalid name).
3. **Duplicate name on edit:** Not covered in DS-2 ACs; behavior when renaming to an existing name is undefined.
4. **Description required on edit:** Unclear whether Description can be cleared during edit.
5. **Non-admin access:** No AC addresses role-based edit restrictions.
6. **Cancel/dismiss behavior:** No AC for Cancel, Escape, or overlay click during edit.
7. **Immediate list update:** AC says "immediately shows" but does not define behavior if the API call fails (optimistic vs. confirmed update).
8. **Max-length validation:** No limits specified for Name or Description on edit.
9. **Concurrent editing:** No guidance on multi-user edit scenarios.
