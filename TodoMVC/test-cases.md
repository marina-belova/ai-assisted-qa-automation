# Test Plan: TodoMVC

**App:** https://demo.playwright.dev/todomvc/  
**Scope:** Add, complete, and delete todo items

---

## Positive flows

### TC-001: New todo appears in the list

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type `Buy milk`.
3. Press Enter.

**Expected result:** `Buy milk` appears in the list as an active item, and the footer shows "1 item left".

---

### TC-002: Completed todo is marked done and no longer counted as left

**Preconditions:**
- The TodoMVC page is open.
- An active todo `Buy milk` is in the list.

**Steps:**
1. Click the checkbox next to `Buy milk`.

**Expected result:** `Buy milk` is shown as completed (strikethrough), and the footer shows "0 items left". The item stays in the list.

---

### TC-003: Deleted todo is removed from the list

**Preconditions:**
- The TodoMVC page is open.
- Todos `Buy milk` and `Walk dog` are in the list.

**Steps:**
1. Hover over `Buy milk`.
2. Click its delete button.

**Expected result:** `Buy milk` is gone. `Walk dog` remains, and the footer count matches the remaining items.

---

## Negative flows

### TC-004: Empty input does not add a todo

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Leave it empty.
3. Press Enter.

**Expected result:** No todo is added. The list stays empty and the footer stays hidden.

---

### TC-005: Completing a todo does not remove it

**Preconditions:**
- The TodoMVC page is open.
- An active todo `Buy milk` is in the list.

**Steps:**
1. Click the checkbox next to `Buy milk`.
2. Click the Completed filter.

**Expected result:** `Buy milk` is still listed under Completed. It is not deleted.

---

### TC-006: Deleting one todo does not delete the others

**Preconditions:**
- The TodoMVC page is open.
- Todos `Buy milk`, `Walk dog`, and `Pay rent` are in the list.

**Steps:**
1. Hover over `Walk dog`.
2. Click its delete button.

**Expected result:** Only `Walk dog` is removed. `Buy milk` and `Pay rent` remain unchanged.

---

## Edge cases

### TC-007: Whitespace-only input does not add a todo

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type three spaces.
3. Press Enter.

**Expected result:** No todo is added. The list stays empty.

---

### TC-008: Leading and trailing spaces are trimmed from the saved title

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type `  Buy milk  `.
3. Press Enter.

**Expected result:** The list shows `Buy milk` with no leading or trailing spaces.

---

### TC-009: A single-character title is saved

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type `A`.
3. Press Enter.

**Expected result:** `A` appears in the list, and the footer shows "1 item left".

---

### TC-010: Special characters are saved and displayed as plain text

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type `Buy milk & eggs <today>`.
3. Press Enter.

**Expected result:** The list shows `Buy milk & eggs <today>` exactly. No HTML is rendered.

---

### TC-011: Duplicate titles are both kept

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Add `Buy milk`.
2. Add `Buy milk` again.

**Expected result:** Two separate items titled `Buy milk` are in the list, and the footer shows "2 items left".

---

### TC-012: A long title is saved in full

**Preconditions:**
- The TodoMVC page is open.
- The todo list is empty.

**Steps:**
1. Click the "What needs to be done?" input.
2. Type a 200-character title (the letter `A` repeated 200 times).
3. Press Enter.

**Expected result:** The todo is added with all 200 characters. The input is cleared and ready for the next item.

---

## Ambiguities and gaps in the acceptance criteria

1. **Empty and whitespace input.** The ACs do not say what happens when the input is empty or only spaces. This plan expects no item to be added, matching the React TodoMVC demo.
2. **Duplicates.** The ACs do not say whether the same title can be added twice. The demo allows duplicates.
3. **Max length.** No maximum title length is defined. The demo has no max-length limit on the input.
4. **Trim.** The ACs do not say whether leading and trailing spaces are stored. The demo trims them before saving.
5. **Completed display.** The ACs say a user can complete an item, but not how that looks (strikethrough, "items left" count, Active/Completed filters).
6. **Delete control.** The ACs do not say the delete button appears only on hover, or what label it uses.
7. **Out of scope.** Edit-on-double-click, toggle-all, Clear completed, filters, and persistence after refresh are not in the ACs.
