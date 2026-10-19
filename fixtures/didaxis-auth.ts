import { request } from '@playwright/test';

export const baseURL = () => process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

function jwtExp(token: string): number | undefined {
  const part = token.split('.')[1];
  if (!part) return undefined;
  const padded = part.replace(/-/g, '+').replace(/_/g, '/');
  const pad =
    padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4));
  try {
    const payload = JSON.parse(Buffer.from(pad, 'base64').toString('utf8')) as {
      exp?: number;
    };
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

export async function captureTokenFromLogin(): Promise<string> {
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
  await page.goto(`${baseURL()}/login`);
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

export async function tokenForCleanup(): Promise<string> {
  const token = process.env.DIDAXIS_API_TOKEN;
  if (token) {
    const exp = jwtExp(token);
    const now = Math.floor(Date.now() / 1000);
    if (exp !== undefined && exp > now) {
      return token;
    }
  }
  return captureTokenFromLogin();
}

async function apiContext(token: string) {
  return request.newContext({
    baseURL: baseURL(),
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

export type ApiCallResult = {
  status: number;
  ok: boolean;
};

export type ProgramListResult = ApiCallResult & {
  body: { data?: Array<{ id?: string }> };
};

export async function getPrograms(token: string): Promise<ProgramListResult> {
  const api = await apiContext(token);
  try {
    const response = await api.get('/api/programs');
    const status = response.status();
    const ok = response.ok();
    const body = (await response.json()) as ProgramListResult['body'];
    return { status, ok, body };
  } finally {
    await api.dispose();
  }
}

export async function deleteProgram(id: string, token: string): Promise<ApiCallResult> {
  const api = await apiContext(token);
  try {
    const response = await api.delete(`/api/programs/${id}`);
    const status = response.status();
    return { status, ok: response.ok() };
  } finally {
    await api.dispose();
  }
}

export async function fetchProgramIds(): Promise<{ token: string; programIds: string[] }> {
  let token = await tokenForCleanup();
  let result = await getPrograms(token);
  if (result.status === 401) {
    token = await captureTokenFromLogin();
    result = await getPrograms(token);
  }
  if (!result.ok) {
    throw new Error(`GET /api/programs failed: ${result.status}`);
  }
  const programIds = (result.body.data ?? [])
    .map((program) => program.id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  return { token, programIds };
}
