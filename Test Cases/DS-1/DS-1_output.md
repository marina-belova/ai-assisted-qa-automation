# Test Plan: Create New Academic Program (DS-1)

**Feature:** Create new academic program  
**Ticket:** DS-1

---

## Positive Flows

### TC-001: Program creation form displays required fields

**Priority:** High

**Preconditions:**
- Admin user account exists and is active.
- User is logged in as admin.

**Steps:**
1. Given I am logged in as admin
2. When I navigate to the Programs page
3. And I click "+ New Program"
4. Then I see the program creation form with fields: Program Name, Description

**Expected result:** The program creation modal opens and displays the Program Name and Description fields, along with Create and Cancel actions.

---

### TC-002: Program is created successfully with valid name and description

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the Programs page.
- No program named "Web Development 2026" exists.

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Web Development 2026"
3. And I fill in Description with "Full-stack web development program"
4. And I click Create
5. Then the modal closes
6. And the program list shows "Web Development 2026"

**Expected result:** The modal closes, the new program appears in the list with name "Web Development 2026" and description "Full-stack web development program", and no error messages are shown.

---

### TC-003: Program is created successfully with name only and empty description

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- No program named "Data Science Fundamentals" exists.

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Data Science Fundamentals"
3. And I leave the Description field empty
4. And I click Create
5. Then the modal closes
6. And the program list shows "Data Science Fundamentals"

**Expected result:** Program is created with an empty or blank description; the list displays the program name without errors.

---

### TC-004: Create button remains disabled until Program Name is provided

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I leave the Program Name field empty
3. Then the Create button is disabled

**Expected result:** The Create button is disabled and cannot be clicked while Program Name is empty.

---

### TC-005: Create button becomes enabled after entering a valid Program Name

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form with an empty Program Name field.

**Steps:**
1. Given I am on the program creation form
2. And the Create button is disabled
3. When I fill in Program Name with "Cloud Computing 2026"
4. Then the Create button is enabled

**Expected result:** The Create button becomes enabled once a non-empty Program Name is entered.

---

## Negative Flows

### TC-006: Program is not created when submission is attempted with empty Program Name

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I leave the Program Name field empty
3. And I fill in Description with "Some description"
4. Then the Create button is disabled
5. And the form is not submitted

**Expected result:** No program is created; the modal remains open; the program list is unchanged.

---

### TC-007: Program is not created when user cancels the creation form

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Program list is known (record current count).

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Cancelled Program"
3. And I fill in Description with "This should not be saved"
4. And I click Cancel
5. Then the modal closes
6. And the program list does not show "Cancelled Program"

**Expected result:** Modal closes without saving; program count and list contents remain unchanged.

---

### TC-008: Non-admin user cannot access program creation form

**Priority:** High

**Preconditions:**
- Non-admin user account exists (e.g., viewer or instructor role).
- User is logged in as non-admin.

**Steps:**
1. Given I am logged in as a non-admin user
2. When I navigate to the Programs page
3. Then I do not see the "+ New Program" button
4. And I cannot open the program creation form

**Expected result:** Program creation is not available to non-admin users; no create modal can be opened.

---

### TC-009: Duplicate program name is rejected on creation

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program named "Web Development 2026" already exists.

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Web Development 2026"
3. And I fill in Description with "Duplicate attempt"
4. And I click Create
5. Then I see an error indicating the name already exists
6. And the program is not created

**Expected result:** An inline or toast error is displayed; modal remains open; duplicate entry is not added to the list.

---

## Edge Cases

### TC-010: Program name at maximum allowed length is accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Maximum Program Name length is defined (e.g., 255 characters).

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with a 255-character string (e.g., "A" repeated 255 times)
3. And I fill in Description with "Boundary length test"
4. And I click Create
5. Then the modal closes
6. And the program list shows the 255-character program name

**Expected result:** Program is created successfully at the maximum allowed name length.

---

### TC-011: Program name exceeding maximum length is rejected

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Maximum Program Name length is defined (e.g., 255 characters).

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with a 256-character string
3. And I fill in Description with "Over limit test"
4. And I click Create
5. Then I see a validation error for Program Name
6. And the program is not created

**Expected result:** Validation prevents submission; user sees a clear max-length error message.

---

### TC-012: Program name with special characters is accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Informatique & IA - Niveau 2"
3. And I fill in Description with "Program with special characters"
4. And I click Create
5. Then the modal closes
6. And the program list shows "Informatique & IA - Niveau 2"

**Expected result:** Program is created with special characters preserved in the name.

---

### TC-013: Program name with only whitespace is treated as empty

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "   " as the Program Name
3. Then the Create button is disabled
4. And the form is not submitted

**Expected result:** Whitespace-only input is trimmed and treated as empty; Create remains disabled.

---

### TC-014: Description at maximum allowed length is accepted

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Maximum Description length is defined (e.g., 1000 characters).

**Steps:**
1. Given I am on the program creation form
2. When I fill in Program Name with "Long Description Program"
3. And I fill in Description with a 1000-character string
4. And I click Create
5. Then the modal closes
6. And the program is created with the full description stored

**Expected result:** Program is created with the maximum-length description without truncation errors.

---

### TC-015: Closing modal via overlay click or Escape does not create a program

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form with partially filled fields.

**Steps:**
1. Given I am on the program creation form
2. And I have filled in Program Name with "Unsaved Program"
3. When I press the Escape key
4. Then the modal closes
5. And the program list does not show "Unsaved Program"

**Expected result:** Dismissing the modal without clicking Create does not persist any data.

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Description field requirement:** ACs do not specify whether Description is required or optional. TC-003 assumes it is optional.
2. **Duplicate name handling:** Not mentioned in DS-1 ACs but is a realistic constraint; covered in TC-009 (may overlap with DS-3).
3. **Maximum field lengths:** No limits are defined for Program Name or Description.
4. **Role-based access:** AC-001 specifies admin login, but no AC covers non-admin denial explicitly.
5. **Modal dismiss behavior:** No AC defines behavior for Cancel, Escape key, or clicking outside the modal.
6. **Whitespace trimming:** Only implied by validation AC; exact trim rules (leading vs. trailing) are not specified.
7. **Success feedback:** AC confirms list update but does not specify toast/notification behavior after creation.
8. **Field label consistency:** Form uses "Program Name" in creation ACs while edit ACs (DS-2) refer to "Name" — label consistency across create/edit is unclear.
