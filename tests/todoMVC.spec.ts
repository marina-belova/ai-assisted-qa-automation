import { test, expect, type Locator, type Page } from '@playwright/test';

const appUrl = 'https://demo.playwright.dev/todomvc/';

function newTodoInput(page: Page): Locator {
  return page.getByPlaceholder('What needs to be done?');
}

function todoItems(page: Page): Locator {
  return page.getByRole('listitem').filter({
    has: page.getByRole('checkbox', { name: 'Toggle Todo', exact: true }),
  });
}

function todoItem(page: Page, title: string): Locator {
  const exactTitle = new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  return todoItems(page).filter({ hasText: exactTitle });
}

function itemsLeft(page: Page, count: number): Locator {
  const label = count === 1 ? '1 item left' : `${count} items left`;
  return page.getByText(label, { exact: true });
}

async function addTodo(page: Page, title: string): Promise<void> {
  const input = newTodoInput(page);
  await input.click();
  await input.fill(title);
  await input.press('Enter');
}

async function completeTodo(page: Page, title: string): Promise<void> {
  await todoItem(page, title).getByRole('checkbox', { name: 'Toggle Todo', exact: true }).click();
}

async function deleteTodo(page: Page, title: string): Promise<void> {
  const item = todoItem(page, title);
  await item.hover();
  await item.getByRole('button', { name: 'Delete', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto(appUrl);
});

test.describe('Positive flows', () => {
  test('TC-001: new todo appears in the list', async ({ page }) => {
    await addTodo(page, 'Buy milk');

    const item = todoItem(page, 'Buy milk');
    await expect(item).toBeVisible();
    await expect(item.getByRole('checkbox', { name: 'Toggle Todo', exact: true })).not.toBeChecked();
    await expect(item.getByText('Buy milk', { exact: true })).not.toHaveCSS('text-decoration-line', 'line-through');
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-002: completed todo is marked done and no longer counted as left', async ({ page }) => {
    await addTodo(page, 'Buy milk');

    await completeTodo(page, 'Buy milk');

    const item = todoItem(page, 'Buy milk');
    await expect(item).toBeVisible();
    await expect(item.getByRole('checkbox', { name: 'Toggle Todo', exact: true })).toBeChecked();
    await expect(item.getByText('Buy milk', { exact: true })).toHaveCSS('text-decoration-line', 'line-through');
    await expect(itemsLeft(page, 0)).toBeVisible();
  });

  test('TC-003: deleted todo is removed from the list', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk dog');

    await deleteTodo(page, 'Buy milk');

    await expect(todoItem(page, 'Buy milk')).toHaveCount(0);
    await expect(todoItem(page, 'Walk dog')).toBeVisible();
    await expect(itemsLeft(page, 1)).toBeVisible();
  });
});

test.describe('Negative flows', () => {
  test('TC-004: empty input does not add a todo', async ({ page }) => {
    const input = newTodoInput(page);
    await input.click();
    await input.press('Enter');

    await expect(todoItems(page)).toHaveCount(0);
    await expect(page.getByText(/\d+ items? left/)).toBeHidden();
  });

  test('TC-005: completing a todo does not remove it', async ({ page }) => {
    await addTodo(page, 'Buy milk');

    await completeTodo(page, 'Buy milk');
    await page.getByRole('link', { name: 'Completed', exact: true }).click();

    await expect(todoItem(page, 'Buy milk')).toBeVisible();
    await expect(todoItems(page)).toHaveCount(1);
  });

  test('TC-006: deleting one todo does not delete the others', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Walk dog');
    await addTodo(page, 'Pay rent');

    await deleteTodo(page, 'Walk dog');

    await expect(todoItem(page, 'Walk dog')).toHaveCount(0);
    await expect(todoItems(page)).toHaveText(['Buy milk', 'Pay rent']);
    await expect(todoItem(page, 'Buy milk').getByRole('checkbox', { name: 'Toggle Todo', exact: true })).not.toBeChecked();
    await expect(todoItem(page, 'Pay rent').getByRole('checkbox', { name: 'Toggle Todo', exact: true })).not.toBeChecked();
  });
});

test.describe('Edge cases', () => {
  test('TC-007: whitespace-only input does not add a todo', async ({ page }) => {
    await addTodo(page, '   ');

    await expect(todoItems(page)).toHaveCount(0);
  });

  test('TC-008: leading and trailing spaces are trimmed from the saved title', async ({ page }) => {
    await addTodo(page, '  Buy milk  ');

    const title = todoItem(page, 'Buy milk').getByText('Buy milk', { exact: true });
    await expect(title).toBeVisible();
    expect(await title.textContent()).toBe('Buy milk');
  });

  test('TC-009: a single-character title is saved', async ({ page }) => {
    await addTodo(page, 'A');

    await expect(todoItem(page, 'A')).toBeVisible();
    await expect(itemsLeft(page, 1)).toBeVisible();
  });

  test('TC-010: special characters are saved and displayed as plain text', async ({ page }) => {
    const title = 'Buy milk & eggs <today>';
    await addTodo(page, title);

    const rendered = todoItem(page, title).getByText(title, { exact: true });
    await expect(rendered).toBeVisible();
    expect(await rendered.innerHTML()).toBe('Buy milk &amp; eggs &lt;today&gt;');
  });

  test('TC-011: duplicate titles are both kept', async ({ page }) => {
    await addTodo(page, 'Buy milk');
    await addTodo(page, 'Buy milk');

    await expect(todoItem(page, 'Buy milk')).toHaveCount(2);
    await expect(itemsLeft(page, 2)).toBeVisible();
  });

  test('TC-012: a long title is saved in full', async ({ page }) => {
    const title = 'A'.repeat(200);
    await addTodo(page, title);

    await expect(todoItem(page, title)).toBeVisible();
    expect(await todoItem(page, title).getByText(title, { exact: true }).textContent()).toBe(title);
    await expect(newTodoInput(page)).toHaveValue('');
    await expect(newTodoInput(page)).toBeEditable();
  });
});
