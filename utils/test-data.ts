import { test } from '@playwright/test';

export function requireBaseUrl(): string {
  const baseUrl = process.env.DIDAXIS_URL?.replace(/\/$/, '');
  if (!baseUrl) {
    throw new Error('DIDAXIS_URL must be set');
  }
  return baseUrl;
}

export function uniqueName(base: string): string {
  try {
    return `${base} ${test.info().project.name} ${Date.now()}`;
  } catch {
    return `${base} ${Date.now()}`;
  }
}

export function uniqueNameSimple(base: string): string {
  return `${base} ${Date.now()}`;
}

export function nameOfLength(length: number): string {
  const suffix = ` ${Date.now()}`;
  return `${'A'.repeat(length - suffix.length)}${suffix}`;
}
