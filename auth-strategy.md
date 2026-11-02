# Authentication strategy

Default: use a stored session except when the test is the login page itself.

Credentials come from `DIDAXIS_EMAIL` and `DIDAXIS_PASSWORD`. The application base URL comes from `DIDAXIS_URL`. Do not hardcode them.

## A. Login-page tests

Use UI login.

- Start without an existing authenticated session. Do not load `playwright/.auth/user.json`.
- Navigate to `/login`.
- Enter the credentials and verify successful login.
- UI login for this case belongs in `pages/LoginPage.ts`.

## B. All other feature tests

Use Playwright `storageState`.

- A setup project runs `tests/auth.setup.ts` before the test suite.
- The setup logs in through the UI.
- Authentication state is saved to `playwright/.auth/user.json`.
- Feature tests reuse that authenticated session.
- Do not perform UI login separately in every test.

`playwright.config.ts` wires this: the `setup` project matches `*.setup.ts`, and the browser projects depend on `setup` and set `storageState` to `playwright/.auth/user.json`. Do not commit `.env` or `playwright/.auth/`.

## C. API authentication

Use API login when speed or programmatic setup is needed.

- Authenticate through `POST /api/auth/login`.
- Read `data.access_token` from the JSON body `{ data: { access_token, user } }`.
- Inject that token into the Playwright API request context as `Authorization: Bearer <access_token>`. If the login response sets a session cookie, inject that cookie into the browser context instead of repeating UI login.
- Use this for bulk setup or one-off scripts, including program cleanup. Do not use it for login-page tests.

`fixtures/didaxis-auth.ts` is the helper for this path. Never print the token, write it into source, or commit it.
