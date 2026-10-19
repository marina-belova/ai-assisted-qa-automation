import type { Page } from '@playwright/test';
import { requireBaseUrl } from '../utils/test-data';

export class LoginPage {
  readonly emailField;
  readonly passwordField;
  readonly signInButton;

  constructor(private readonly page: Page) {
    this.emailField = page.getByLabel('Email');
    this.passwordField = page.getByLabel('Password');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
  }

  async goto(): Promise<void> {
    await this.page.goto(`${requireBaseUrl()}/login`);
  }

  async gotoTestStudioLogin(): Promise<void> {
    await this.page.goto('https://test.didaxis.studio/login');
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.emailField.fill(email);
    await this.passwordField.fill(password);
    await this.signInButton.click();
  }

  async signInWithEnvCredentials(): Promise<void> {
    const email = process.env.DIDAXIS_EMAIL;
    const password = process.env.DIDAXIS_PASSWORD;
    if (!email || !password) {
      throw new Error('DIDAXIS_EMAIL and DIDAXIS_PASSWORD must be set');
    }
    await this.signIn(email, password);
  }

  async waitForAppRoot(): Promise<void> {
    await this.page.waitForURL('https://test.didaxis.studio/');
  }

  async waitForProgramsUrl(): Promise<void> {
    await this.page.waitForURL('**/programs');
  }
}
