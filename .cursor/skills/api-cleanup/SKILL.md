---
name: api-cleanup
description: Ensures Playwright tests clean up the data they create. Use whenever generating or reviewing tests that create programs (or any persistent records) in Didaxis, so test data does not accumulate. Apply this to every test that creates data — even if cleanup isn't explicitly requested.
---

# API Cleanup for Test Data

Tests that create data must remove it. Leftover data slows the app and
makes test runs unreliable. Every test that creates a program must track
its UUID and delete it via the API afterwards.

## Steps

1. Use the shared cleanup fixture in `fixtures/cleanup.fixture.ts`.
   Import `test` from there, not from `@playwright/test`.

2. Pass `trackProgram` to the create helper. Do not register the id
   from the helper's return value.

   ```ts
   await modal.submitCreateWithReload(trackProgram);
   ```

   Or:

   ```ts
   await programs.createProgram(name, description, { onCreated: trackProgram });
   ```

   The helper calls `trackProgram` immediately after a successful `POST`
   returns `data.id`, before the dialog, reload, and row waits.

3. `test.afterEach` in the fixture deletes every id still tracked for
   that test. Do not delete from fixture teardown. Do not add an `afterAll`.

4. The cleanup request is `DELETE /api/programs/<uuid>` with a Bearer
   token from `process.env.DIDAXIS_API_TOKEN`. `deleteProgram` in
   `fixtures/didaxis-auth.ts` returns `{ status: number, ok: boolean }`.
   A 2xx succeeds. A 401 refreshes the token once and retries that delete.
   Any other non-2xx, including 404, throws
   `Cleanup failed for ${id}: ${status}`.

5. When the test deletes a program through the UI, pass `untrackProgram`
   to `confirmDeleteProgram(name, untrackProgram)`. The Page Object calls
   that callback only after the DELETE response succeeds and the id is in
   that response URL. `untrackProgram` removes only that id. A cancelled
   or failed UI DELETE leaves the program registered for `afterEach`.

6. Never hardcode the token. Never delete data the test did not create.

## Reference

- Endpoint: DELETE https://test.didaxis.studio/api/programs/<uuid>
- Auth: Authorization: Bearer ${DIDAXIS_API_TOKEN}
- Create response: `POST /api/programs` returns `{ data: { id, ... } }`. `data.id` is the UUID to track.
- List shape: `GET /api/programs` returns `{ data: [{ id, name, ... }] }`.

## Fixture

`fixtures/cleanup.fixture.ts` exports `test` and `expect`. The extended `test` provides `trackProgram` and `untrackProgram` as fixtures. Both record ids for the current test only. `test.afterEach` deletes the ids still on that list. The code after `await use(...)` only removes the list. It does not send DELETE. `tokenForCleanup` and `captureTokenFromLogin` live in `fixtures/didaxis-auth.ts`. The fixture imports them.

## Expired token

`DIDAXIS_API_TOKEN` is a JWT. It expires 15 minutes after issue (`exp - iat` is 900 seconds). A 401 on DELETE means it is stale.

The SPA does not put the access token in `localStorage`, `sessionStorage`, or `document.cookie`. After login it keeps the token in memory and sends `Authorization: Bearer <access_token>`. Reading storage after login will not yield a token.

Capture a new token from the login response:

1. Open `${DIDAXIS_URL}/login` in a Playwright browser context.
2. Sign in with `DIDAXIS_EMAIL` and `DIDAXIS_PASSWORD` (Email, Password, Sign In). Do not hardcode them.
3. Wait for `POST /api/auth/login` to return 200.
4. Read `data.access_token` from the JSON body: `{ data: { access_token, user } }`.
5. Set `process.env.DIDAXIS_API_TOKEN` to that value for the rest of the run, then use it as the Bearer token.
6. Do not print the token, write it into source, or commit `.env`.

```ts
async function captureTokenFromLogin(): Promise<string> {
  const { chromium } = await import('@playwright/test');
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const loginResponse = page.waitForResponse(
    (res) => res.url().endsWith('/api/auth/login') && res.ok(),
  );
  const base = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  await page.goto(`${base}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  const body = await (await loginResponse).json();
  await browser.close();

  const token = body?.data?.access_token as string | undefined;
  if (!token) throw new Error('Login response did not include data.access_token');
  process.env.DIDAXIS_API_TOKEN = token;
  return token;
}
```

`tokenForCleanup` returns `process.env.DIDAXIS_API_TOKEN` when that JWT's `exp` is still in the future. Otherwise it calls `captureTokenFromLogin()`.

Inside an already logged-in browser, the app renews its own memory token with `POST /api/auth/refresh` (cookie, `withCredentials`). That call returns the same `{ data: { access_token } }` shape. Use it only when the browser context still has the session cookie. A fresh API request context does not. Prefer the login capture above for the `afterEach` delete.
