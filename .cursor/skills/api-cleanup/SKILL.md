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

2. When a test creates a program, capture the program's UUID and call
   `trackProgram(uuid)` immediately.

3. Do not write manual `afterAll` blocks for cleanup — the fixture
   handles teardown for every test that uses it.

4. Cleanup uses the DELETE API, not the UI:
   `DELETE /api/programs/<uuid>` with a Bearer token from
   `process.env.DIDAXIS_API_TOKEN`.

5. Never hardcode the token. Never delete data the test did not create.

## Reference

- Endpoint: DELETE https://test.didaxis.studio/api/programs/<uuid>
- Auth: Authorization: Bearer ${DIDAXIS_API_TOKEN}
- Create response: `POST /api/programs` returns `{ data: { id, ... } }`. `data.id` is the UUID to track.
- List shape: `GET /api/programs` returns `{ data: [{ id, name, ... }] }`.

## Fixture

`fixtures/cleanup.fixture.ts` exports `test` and `expect`. `trackProgram` records ids for the current test only. Teardown is the code after `await use(...)` in the fixture, which runs when that test finishes. Delete each tracked id. If a delete returns 401, refresh the token (below) and retry that delete once. Leave every other program alone.

```ts
import { test as base, request, expect } from '@playwright/test';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

const baseURL = () => process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

async function deleteProgram(id: string, token: string) {
  const api = await request.newContext({
    baseURL: baseURL(),
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  try {
    return await api.delete(`/api/programs/${id}`);
  } finally {
    await api.dispose();
  }
}

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use) => {
    const ids: string[] = [];
    await use((uuid) => {
      ids.push(uuid);
    });
    if (ids.length === 0) return;

    let token = await tokenForCleanup();
    for (const id of ids) {
      let response = await deleteProgram(id, token);
      if (response.status() === 401) {
        token = await captureTokenFromLogin();
        response = await deleteProgram(id, token);
      }
      if (!response.ok()) {
        throw new Error(`Cleanup failed for ${id}: ${response.status()}`);
      }
    }
  },
});

export { expect };
```

Keep `tokenForCleanup` and `captureTokenFromLogin` in this same file.

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

Inside an already logged-in browser, the app renews its own memory token with `POST /api/auth/refresh` (cookie, `withCredentials`). That call returns the same `{ data: { access_token } }` shape. Use it only when the browser context still has the session cookie. A fresh API request context does not. Prefer the login capture above for fixture teardown.
