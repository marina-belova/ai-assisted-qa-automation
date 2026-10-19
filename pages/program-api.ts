import type { Response } from '@playwright/test';

export function isProgramsResponse(response: Response, method: string): boolean {
  return (
    response.request().method() === method &&
    new URL(response.url()).pathname === '/api/programs' &&
    response.ok()
  );
}

export function isProgramItemResponse(response: Response, method: string): boolean {
  return (
    response.request().method() === method &&
    /\/api\/programs\/[^/]+$/.test(new URL(response.url()).pathname) &&
    response.ok()
  );
}

export function deleteProgramConfirmationMessage(name: string): string {
  return `Delete program "${name}"? All its semesters and courses will be removed. This cannot be undone.`;
}
