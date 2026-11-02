---
name: network-mocking
description: Deterministic Programs API mocks with page.route and route.fulfill. Use when a test must force a save or list response. Assert only UI behavior observed in Playwright MCP.
---

# Network mocking (Programs)

Inspect the mocked screen with Playwright MCP before writing an assertion. Assert only text and exceptions that inspection showed. Do not invent an error message, an empty-state sentence, or a no-crash result.

Mock with `page.route()` and `route.fulfill()`. For a timeout, abort that same request with `timedout`. Intercept only the Programs request that produces the behavior under test. Use `pages/ProgramsPage.ts` and `pages/EditProgramModal.ts`. Do not edit application source. Give each test exactly one tag that names the scenario.

These results were observed on `https://test.didaxis.studio`. Error bodies were `{}`. No response message was supplied by the mock. Where the homework expected a visible error or a page that stays up, the observed result is stated and the gap is named.

## Save: HTTP 503

Intercept only `PATCH /api/programs/<uuid>` from the Edit Program **Save** button.

The homework asks for the actual UI error state.

Observed:

- The Edit Program dialog stays open.
- No `alert` or `status` appears, and the page text does not change.
- The page throws `Request failed with status code 503`.
- The console reports `Failed to load resource: the server responded with a status of 503 (Service Unavailable)`.

The app does not show a visible error message. Do not assert one.

## List: HTTP 200 with an empty array

Intercept only `GET /api/programs`. Fulfill `200` with `{ "data": [] }`.

Observed message, exact text:

`No programs yet. Create your first program to get started.`

`+ New Program` stays visible. There is no page exception.

A raw body `[]` is not this empty state. It throws `Cannot read properties of undefined (reading 'length')` and the main region is empty.

That same empty-state sentence also appears for a failed `GET /api/programs` (see below). Assert it for the empty list only together with the `200` body `{ "data": [] }`.

## List: HTTP 200 with a malformed payload

Intercept only `GET /api/programs`. Fulfill `200` with `{ "data": { "id": "not-a-list" } }`.

The homework asks to verify that the application does not crash.

Observed: the page throws `t.map is not a function`, the main region is empty, and `+ New Program` is not visible. The application crashes. Do not assert that it stays up.

## Other Programs responses

Intercept only `GET /api/programs` or the Save `PATCH /api/programs/<uuid>`. Do not mock an unrelated endpoint. Do not add a status that is not listed here until Playwright MCP has shown it.

`GET /api/programs` fulfilled with `404`, `401`, `403`, `500`, or `502` and body `{}`:

- The page shows `No programs yet. Create your first program to get started.`
- `+ New Program` stays visible.
- No `alert` appears.
- The page throws `Request failed with status code <status>`.
- This is not a distinct error screen. The visible sentence matches the empty list.

`GET /api/programs` aborted with `timedout`:

- The same empty-state sentence is shown and `+ New Program` stays visible.
- The page throws `timeout exceeded`.

`GET /api/programs` fulfilled with `302` and `Location: /login`:

- The URL stays on `/programs`.
- The main region is empty and `+ New Program` is not visible.
- The page throws `Cannot read properties of undefined (reading 'length')`.
- A navigation to `/login` was not observed.

Save `PATCH` fulfilled with `404`, `401`, `403`, `500`, or `502` and body `{}`:

- The Edit Program dialog stays open.
- No new page text and no `alert`.
- The page throws `Request failed with status code <status>`.

Save `PATCH` aborted with `timedout`:

- The dialog stays open, no new page text, no `alert`.
- The page throws `timeout exceeded`.

Save `PATCH` fulfilled with `302` and `Location: /login`:

- The dialog stays open, no new page text, no `alert`.
- The page throws `Request failed with status code 405`.
- A navigation to `/login` was not observed.
