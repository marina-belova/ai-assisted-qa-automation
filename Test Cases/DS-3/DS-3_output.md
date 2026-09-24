# Test Plan: Program Name Validation and Duplicate Prevention (DS-3)

**Feature:** Program name validation and duplicate prevention  
**Ticket:** DS-3

---

## Positive Flows

### TC-001: Program name with special characters is accepted

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- No program named "Informatique & IA - Niveau 2" exists.

**Steps:**
1. Given I am on the program creation form
2. When I enter "Informatique & IA - Niveau 2" as the program name
3. And I fill other required fields
4. And I click Create
5. Then the program is created successfully

**Expected result:** Program is created with the exact name "Informatique & IA - Niveau 2"; special characters are preserved in the list.

---

### TC-002: Valid program name with leading and trailing spaces is trimmed and accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- No program named "Cybersecurity 2026" exists.

**Steps:**
1. Given I am on the program creation form
2. When I enter "  Cybersecurity 2026  " as the program name
3. And I fill in Description with "Security fundamentals program"
4. And I click Create
5. Then the program is created successfully
6. And the program list shows "Cybersecurity 2026"

**Expected result:** Leading and trailing whitespace is trimmed; program is stored and displayed as "Cybersecurity 2026".

---

### TC-003: Program name at minimum valid length (single character) is accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- No program named "X" exists.

**Steps:**
1. Given I am on the program creation form
2. When I enter "X" as the program name
3. And I fill in Description with "Single character name test"
4. And I click Create
5. Then the program is created successfully

**Expected result:** Single-character program name is accepted and displayed in the list.

---

### TC-004: Program name at maximum allowed length is accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Maximum name length is 255 characters.

**Steps:**
1. Given I am on the program creation form
2. When I enter a 255-character program name
3. And I fill in Description with "Max length boundary test"
4. And I click Create
5. Then the program is created successfully

**Expected result:** Program is created at the maximum allowed name length without truncation or error.

---

### TC-005: Editing a program to the same name (no change) is allowed

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists.

**Steps:**
1. Given I am editing "Web Development 2026"
2. When I keep the Name as "Web Development 2026"
3. And I change the Description to "Updated description only"
4. And I click Save
5. Then the program is updated successfully
6. And no duplicate name error is shown

**Expected result:** Saving without changing the name does not trigger a false duplicate error.

---

## Negative Flows

### TC-006: Whitespace-only program name is rejected

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "   " as the program name
3. And I click Create
4. Then the form is not submitted (name is trimmed, treated as empty)

**Expected result:** Form is not submitted; Create button is disabled or validation error is shown; no program is created.

---

### TC-007: Duplicate program name is rejected on creation

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" already exists.

**Steps:**
1. Given a program "Web Development 2026" already exists
2. When I try to create a new program with the same name
3. Then I see an error indicating the name already exists

**Expected result:** Clear error message (e.g., "A program with this name already exists"); no duplicate entry is created.

---

### TC-008: Duplicate program name is rejected on edit

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Programs "Web Development 2026" and "Data Science 2026" exist.

**Steps:**
1. Given I am editing "Data Science 2026"
2. When I change the Name to "Web Development 2026"
3. And I click Save
4. Then I see an error indicating the name already exists
5. And the program is not updated

**Expected result:** Duplicate check applies on edit; original program data is preserved.

---

### TC-009: Empty program name is rejected

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I leave the program name empty
3. And I click Create
4. Then the form is not submitted
5. And the Create button is disabled

**Expected result:** Empty name is blocked; no program is created.

---

### TC-010: Program name exceeding maximum length is rejected

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.
- Maximum name length is 255 characters.

**Steps:**
1. Given I am on the program creation form
2. When I enter a 256-character program name
3. And I fill in Description with "Over limit test"
4. And I click Create
5. Then I see a validation error for the program name
6. And the program is not created

**Expected result:** Validation error indicates max length exceeded; form is not submitted.

---

### TC-011: Duplicate check is case-sensitive (or case-insensitive — verify expected behavior)

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" already exists.

**Steps:**
1. Given a program "Web Development 2026" already exists
2. When I try to create a new program with the name "web development 2026"
3. Then I see an error indicating the name already exists

**Expected result:** Duplicate detection treats names case-insensitively (expected best practice); verify actual behavior against spec.

---

## Edge Cases

### TC-012: Duplicate name with different whitespace is rejected

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" already exists.

**Steps:**
1. Given a program "Web Development 2026" already exists
2. When I try to create a new program with the name "  Web Development 2026  "
3. And I click Create
4. Then I see an error indicating the name already exists

**Expected result:** After trimming, duplicate is detected; no second program is created.

---

### TC-013: Program name with Unicode characters is accepted

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "プログラミング基礎 2026" as the program name
3. And I fill in Description with "Japanese program name test"
4. And I click Create
5. Then the program is created successfully

**Expected result:** Unicode characters are accepted and displayed correctly in the list.

---

### TC-014: Program name with HTML/script tags is sanitized or rejected

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "<script>alert('xss')</script>" as the program name
3. And I fill in Description with "XSS test"
4. And I click Create
5. Then the program is either created with escaped/safe display or rejected with validation error
6. And no script is executed in the program list

**Expected result:** XSS payload is neutralized; name is stored safely and rendered as plain text.

---

### TC-015: Program name with emoji characters is accepted

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "AI Bootcamp 🚀 2026" as the program name
3. And I fill in Description with "Emoji in name test"
4. And I click Create
5. Then the program is created successfully

**Expected result:** Emoji characters are preserved in storage and display.

---

### TC-016: Duplicate name error persists until name is changed

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- A program "Web Development 2026" already exists.

**Steps:**
1. Given I am on the program creation form
2. When I enter "Web Development 2026" as the program name
3. And I click Create
4. Then I see an error indicating the name already exists
5. When I change the name to "Web Development 2027"
6. And I click Create
7. Then the program is created successfully

**Expected result:** Error clears after correcting the name; user can recover without closing the form.

---

### TC-017: Tab and newline characters in program name are handled correctly

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- User is on the program creation form.

**Steps:**
1. Given I am on the program creation form
2. When I enter "Web\tDevelopment\n2026" as the program name
3. And I click Create
4. Then the form is either rejected with validation error or the name is sanitized

**Expected result:** Control characters are not allowed in program names; behavior is consistent and documented.

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Case sensitivity:** ACs do not specify whether duplicate detection is case-sensitive ("Web Development" vs. "web development").
2. **Whitespace trimming rules:** AC covers whitespace-only input but not leading/trailing trim on valid names or duplicate comparison after trim.
3. **Maximum/minimum length:** No length limits are defined in the ACs.
4. **Allowed special characters:** AC shows one accepted example but does not define the full set of allowed/disallowed characters.
5. **Duplicate on edit:** AC only covers creation; edit-time duplicate behavior is not specified.
6. **Error message format:** AC says "an error indicating the name already exists" but does not specify inline field error vs. toast vs. modal.
7. **Same-name save on edit:** Unclear whether saving a program without renaming should bypass duplicate check.
8. **Internationalization:** No guidance on Unicode, RTL text, or locale-specific characters beyond the French example.
9. **Security:** No AC for XSS or injection in program names.
