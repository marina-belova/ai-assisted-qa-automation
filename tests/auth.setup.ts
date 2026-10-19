import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPage } from '../pages/LoginPage';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  const login = new LoginPage(page);
  await login.gotoTestStudioLogin();
  await login.signInWithEnvCredentials();
  await login.waitForAppRoot();
  await page.goto('https://test.didaxis.studio/programs');
  await login.waitForProgramsUrl();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
