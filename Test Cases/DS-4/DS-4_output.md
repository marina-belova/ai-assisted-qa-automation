# Test Plan: Delete Program with Confirmation (DS-4)

**Feature:** Delete program with confirmation  
**Ticket:** DS-4

---

## Positive Flows

### TC-001: Program is deleted after user confirms in the dialog

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program "Test Program" exists on the Programs page.

**Steps:**
1. Given a program "Test Program" exists
2. When I click the delete icon for "Test Program"
3. Then I see a confirmation dialog
4. When I confirm deletion
5. Then "Test Program" is removed from the program list

**Expected result:** Confirmation dialog appears; after confirming, "Test Program" is no longer visible in the list.

---

### TC-002: Program deletion is cancelled and program remains in the list

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program "Test Program" exists on the Programs page.

**Steps:**
1. Given I click the delete icon for a program
2. When I see the confirmation dialog
3. And I click Cancel
4. Then the program still exists in the list

**Expected result:** Dialog closes; "Test Program" remains in the list with all data intact.

---

### TC-003: Confirmation dialog displays the correct program name

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists.

**Steps:**
1. Given a program "Web Development 2026" exists
2. When I click the delete icon for "Web Development 2026"
3. Then I see a confirmation dialog
4. And the dialog message references "Web Development 2026"

**Expected result:** Dialog clearly identifies which program will be deleted (e.g., "Are you sure you want to delete Web Development 2026?").

---

### TC-004: Program list count decreases by one after confirmed deletion

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Exactly 3 programs exist on the Programs page.
- Current program count is recorded.

**Steps:**
1. Given 3 programs exist on the Programs page
2. When I click the delete icon for one program
3. And I confirm deletion
4. Then the program list shows 2 programs

**Expected result:** List count decreases by exactly one; remaining programs are unaffected.

---

## Negative Flows

### TC-005: Program is not deleted when confirmation dialog is dismissed via Escape

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I see the confirmation dialog
3. And I press the Escape key
4. Then the program still exists in the list

**Expected result:** Dialog closes without deleting; program remains in the list.

---

### TC-006: Program is not deleted when confirmation dialog is dismissed by clicking outside

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I see the confirmation dialog
3. And I click outside the dialog (overlay)
4. Then the program still exists in the list

**Expected result:** Overlay click dismisses dialog without deletion (or deletion requires explicit confirm — verify expected behavior).

---

### TC-007: Non-admin user cannot delete programs

**Priority:** High

**Preconditions:**
- Non-admin user is logged in.
- Program "Test Program" exists on the Programs page.

**Steps:**
1. Given I am logged in as a non-admin user
2. And I am on the Programs page
3. When I view the program "Test Program"
4. Then I do not see a delete icon
5. And I cannot delete the program

**Expected result:** Delete action is unavailable to non-admin users.

---

### TC-008: Program is not deleted when API/server error occurs during deletion

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.
- Backend deletion endpoint is unavailable or returns an error.

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I confirm deletion
3. And the server returns an error
4. Then I see an error message indicating deletion failed
5. And "Test Program" still exists in the program list

**Expected result:** User is informed of failure; program is not removed from the list on error.

---

### TC-009: Double-clicking confirm does not cause duplicate deletion errors

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I see the confirmation dialog
3. And I double-click the Confirm button rapidly
4. Then "Test Program" is removed from the program list once
5. And no error occurs

**Expected result:** Idempotent deletion; no duplicate API calls cause errors or unexpected behavior.

---

## Edge Cases

### TC-010: Deleting the only program in the system shows empty state

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Exactly one program "Test Program" exists.

**Steps:**
1. Given only one program "Test Program" exists
2. When I click the delete icon for "Test Program"
3. And I confirm deletion
4. Then "Test Program" is removed from the program list
5. And I see a message indicating no programs have been created

**Expected result:** After deleting the last program, the empty state message and create prompt are displayed (aligns with DS-5).

---

### TC-011: Deleting a program with a long name displays correctly in confirmation dialog

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- A program with a 255-character name exists.

**Steps:**
1. Given a program with a 255-character name exists
2. When I click the delete icon for that program
3. Then I see a confirmation dialog
4. And the program name is fully or appropriately truncated in the dialog

**Expected result:** Long name is readable in the dialog without breaking layout.

---

### TC-012: Deleting a program with special characters in the name works correctly

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Informatique & IA - Niveau 2" exists.

**Steps:**
1. Given a program "Informatique & IA - Niveau 2" exists
2. When I click the delete icon for "Informatique & IA - Niveau 2"
3. And I confirm deletion
4. Then "Informatique & IA - Niveau 2" is removed from the program list

**Expected result:** Special characters in the name do not break the delete flow or confirmation dialog.

---

### TC-013: Cancelled deletion allows immediate retry

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I see the confirmation dialog
3. And I click Cancel
4. And I click the delete icon for "Test Program" again
5. And I confirm deletion
6. Then "Test Program" is removed from the program list

**Expected result:** User can cancel and retry deletion without issues.

---

### TC-014: Deleted program name becomes available for reuse

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists and is deleted.

**Steps:**
1. Given I delete the program "Test Program"
2. When I create a new program with the name "Test Program"
3. And I click Create
4. Then the program is created successfully

**Expected result:** After deletion, the program name is freed and can be reused without duplicate error.

---

### TC-015: Delete icon is not visible or is disabled during an in-progress deletion

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Program "Test Program" exists.
- Network is slow (simulated).

**Steps:**
1. Given I click the delete icon for "Test Program"
2. When I confirm deletion
3. And the deletion request is in progress
4. Then the Confirm button is disabled or a loading indicator is shown
5. And I cannot trigger a second deletion

**Expected result:** UI prevents duplicate deletion attempts while request is pending.

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Dialog content:** AC confirms a dialog appears but does not specify the exact message, button labels (Delete/Confirm/Cancel), or whether the program name is shown.
2. **Dismiss methods:** No AC for Escape key or overlay click behavior on the confirmation dialog.
3. **Role-based access:** No AC specifies that only admins can delete programs.
4. **Cascade effects:** Unclear whether deleting a program affects related data (courses, enrollments, cohorts).
5. **Soft vs. hard delete:** AC says "removed from the list" but does not clarify if data is permanently deleted or archived.
6. **Error handling:** No AC for server/network failure during deletion.
7. **Empty state transition:** No AC for behavior after deleting the last program (though DS-5 covers empty state separately).
8. **Undo/recovery:** No mention of undo or restore functionality after deletion.
9. **Confirmation button label:** "Confirm deletion" is used in AC but actual button text is unspecified.
