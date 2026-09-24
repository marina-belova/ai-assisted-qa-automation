# Test Plan: Program List Filtering and Display (DS-5)

**Feature:** Program list filtering and display  
**Ticket:** DS-5

---

## Positive Flows

### TC-001: Program list displays name and description for each program

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- Programs exist in the system:
  - "Web Development 2026" — "Full-stack web development program"
  - "Data Science 2026" — "Machine learning and analytics program"

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. Then I see a list showing each program's name and description

**Expected result:** Both programs are listed; each row/card shows the program name and its description clearly.

---

### TC-002: Empty state is shown when no programs exist

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- No programs exist in the system.

**Steps:**
1. Given no programs exist
2. When I navigate to the Programs page
3. Then I see a message indicating no programs have been created
4. And I see a prompt to create the first program

**Expected result:** Empty state message is displayed (e.g., "No programs yet"); a call-to-action such as "+ New Program" or "Create your first program" is visible.

---

### TC-003: Empty state create prompt opens the program creation form

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- No programs exist in the system.

**Steps:**
1. Given no programs exist
2. When I navigate to the Programs page
3. And I see a prompt to create the first program
4. And I click the create prompt or "+ New Program"
5. Then I see the program creation form with fields: Program Name, Description

**Expected result:** Clicking the empty-state prompt opens the same creation form as the header "+ New Program" button.

---

### TC-004: Program list updates immediately after creating a new program

**Priority:** High

**Preconditions:**
- User is logged in as admin.
- No programs exist initially.

**Steps:**
1. Given no programs exist
2. When I navigate to the Programs page
3. And I create a program named "Web Development 2026" with description "Full-stack web development program"
4. Then the program list shows "Web Development 2026" with its description
5. And the empty state message is no longer displayed

**Expected result:** List transitions from empty state to populated list without page refresh.

---

### TC-005: Program list updates immediately after editing a program

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Web Development 2026" exists with description "Full-stack web development program".

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. And I edit "Web Development 2026" to change the description to "Updated curriculum"
4. Then the program list shows "Web Development 2026" with description "Updated curriculum"

**Expected result:** Updated description is reflected in the list immediately after save.

---

### TC-006: Program list updates immediately after deleting a program

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Programs "Web Development 2026" and "Data Science 2026" exist.

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. And I delete "Data Science 2026"
4. Then the program list shows only "Web Development 2026"
5. And "Data Science 2026" is no longer displayed

**Expected result:** Deleted program is removed from the list without page refresh.

---

## Negative Flows

### TC-007: Program list does not show stale data after failed creation

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- One program "Web Development 2026" exists.
- Backend create endpoint will fail (simulated).

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. And I attempt to create a duplicate program "Web Development 2026"
4. And the creation fails with an error
5. Then the program list still shows only the original "Web Development 2026"
6. And no duplicate entry appears in the list

**Expected result:** Failed create does not add phantom entries to the list.

---

### TC-008: Non-admin user can view the program list but cannot create from empty state actions (if restricted)

**Priority:** Medium

**Preconditions:**
- Non-admin user is logged in.
- Programs exist in the system.

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page as a non-admin user
3. Then I see a list showing each program's name and description
4. And I do not see create, edit, or delete actions

**Expected result:** List is readable by non-admin; management actions are hidden or disabled.

---

### TC-009: Program list does not display internal/system fields

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Programs exist in the system.

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. Then I see each program's name and description
4. And I do not see internal IDs, created-at timestamps, or deleted flags

**Expected result:** Only user-facing fields (name, description) are shown unless explicitly designed otherwise.

---

### TC-010: Error state is shown when program list fails to load

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Programs API endpoint is unavailable (simulated).

**Steps:**
1. Given the programs API is unavailable
2. When I navigate to the Programs page
3. Then I see an error message indicating programs could not be loaded
4. And I do not see a blank page or misleading empty state

**Expected result:** Clear error message with retry option; empty state is not shown when data failed to load.

---

## Edge Cases

### TC-011: Program with empty description displays gracefully in the list

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Minimal Program" exists with an empty description.

**Steps:**
1. Given a program "Minimal Program" exists with no description
2. When I navigate to the Programs page
3. Then I see "Minimal Program" in the list
4. And the description area shows blank, em dash, or "No description"

**Expected result:** Empty description does not break layout; placeholder or blank is shown consistently.

---

### TC-012: Program with long name and description displays without breaking layout

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program with 255-character name and 1000-character description exists.

**Steps:**
1. Given a program with maximum-length name and description exists
2. When I navigate to the Programs page
3. Then I see the program in the list
4. And long text is truncated with ellipsis or wrapped without overflow

**Expected result:** List layout remains intact; long content is handled with truncation or wrapping.

---

### TC-013: Program with special characters in name and description displays correctly

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Program "Informatique & IA - Niveau 2" exists with description containing quotes and ampersands.

**Steps:**
1. Given a program "Informatique & IA - Niveau 2" exists
2. When I navigate to the Programs page
3. Then I see "Informatique & IA - Niveau 2" displayed correctly
4. And the description special characters are rendered as plain text

**Expected result:** Special characters display correctly without HTML encoding issues or XSS.

---

### TC-014: Large number of programs displays with acceptable performance

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- 100+ programs exist in the system.

**Steps:**
1. Given 100 programs exist in the system
2. When I navigate to the Programs page
3. Then I see the program list load within acceptable time (e.g., under 3 seconds)
4. And all programs are accessible via scroll or pagination

**Expected result:** List handles large datasets without timeout or browser freeze; pagination or virtual scroll may be used.

---

### TC-015: Program list sort order is consistent

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Multiple programs exist with known creation order.

**Steps:**
1. Given programs "Alpha Program", "Beta Program", and "Gamma Program" exist
2. When I navigate to the Programs page
3. Then programs are displayed in a consistent order (e.g., alphabetical by name or newest first)

**Expected result:** Sort order is predictable and consistent across page loads.

---

### TC-016: Transition from populated list to empty state after deleting last program

**Priority:** Medium

**Preconditions:**
- User is logged in as admin.
- Exactly one program exists.

**Steps:**
1. Given one program "Web Development 2026" exists
2. When I navigate to the Programs page
3. And I delete "Web Development 2026"
4. Then I see a message indicating no programs have been created
5. And I see a prompt to create the first program

**Expected result:** List transitions cleanly from populated to empty state after last deletion.

---

### TC-017: Program list is accessible via keyboard navigation

**Priority:** Low

**Preconditions:**
- User is logged in as admin.
- Multiple programs exist.

**Steps:**
1. Given programs exist in the system
2. When I navigate to the Programs page
3. And I use Tab to navigate through the program list
4. Then each program row and action button receives visible focus
5. And I can activate edit/delete actions via keyboard

**Expected result:** List and actions are keyboard-accessible with visible focus indicators.

---

## Ambiguities and Gaps in the Acceptance Criteria

1. **Filtering functionality:** Ticket title mentions "filtering" but ACs only cover display and empty state — no filter/search criteria are defined.
2. **Sort order:** No AC specifies how programs are ordered in the list.
3. **List layout:** No AC defines table vs. card layout, columns, or responsive behavior.
4. **Empty state exact copy:** Message text and CTA label are not specified.
5. **Pagination:** No guidance for large datasets (100+ programs).
6. **Empty description display:** Unclear how programs with no description appear in the list.
7. **Non-admin view:** ACs assume navigation to Programs page but do not define read-only vs. admin views.
8. **Error vs. empty state:** No AC distinguishes API failure from genuinely empty data.
9. **Additional fields:** Unclear if created date, status, or action icons should appear alongside name and description.
10. **Real-time updates:** No AC for list refresh when another user creates/edits/deletes a program concurrently.
