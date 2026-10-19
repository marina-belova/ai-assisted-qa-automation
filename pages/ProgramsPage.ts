import type { Page } from '@playwright/test';
import { requireBaseUrl } from '../utils/test-data';
import { isProgramItemResponse, isProgramsResponse } from './program-api';
import { waitUntilDialogsClosed } from './dialog-sync';
import { EditProgramModal } from './EditProgramModal';
import { NewProgramModal } from './NewProgramModal';

export class ProgramsPage {
  readonly newProgramButton;
  readonly alerts;
  readonly table;

  constructor(private readonly page: Page) {
    this.newProgramButton = page.getByRole('button', { name: '+ New Program', exact: true });
    this.alerts = page.getByRole('alert');
    this.table = page.getByRole('table');
  }

  async goto(): Promise<void> {
    await this.page.goto(`${requireBaseUrl()}/programs`);
  }

  async gotoAndWaitForProgramsList(): Promise<void> {
    const listed = this.page.waitForResponse((response) => isProgramsResponse(response, 'GET'), {
      timeout: 60_000,
    });
    await this.goto();
    await listed;
  }

  async reloadAndWaitForProgramsList(): Promise<void> {
    const listed = this.page.waitForResponse((response) => isProgramsResponse(response, 'GET'));
    await this.page.reload();
    await listed;
  }

  programNameText(name: string) {
    return this.page.getByText(name, { exact: true });
  }

  programCell(name: string) {
    return this.page.getByRole('cell').filter({ has: this.page.getByText(name, { exact: true }) });
  }

  programCellByDescription(description: string) {
    return this.page.getByRole('cell').filter({ has: this.page.getByText(description, { exact: true }) });
  }

  programCellByExactName(name: string) {
    return this.page.getByRole('cell', { name, exact: true });
  }

  programCellDescriptionParagraph(name: string) {
    return this.programCell(name).getByRole('paragraph');
  }

  textInProgramCell(programName: string, text: string) {
    return this.programCell(programName).getByText(text, { exact: true });
  }

  textInProgramCellByDescription(description: string, text: string) {
    return this.programCellByDescription(description).getByText(text, { exact: true });
  }

  duplicateNameErrorText() {
    return this.page.getByText(/already exists|duplicate/i);
  }

  async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  editProgramButton(name: string) {
    return this.page.getByRole('button', { name: `Edit ${name}`, exact: true });
  }

  deleteProgramButton(name: string) {
    return this.page.getByRole('button', { name: `Delete ${name}`, exact: true });
  }

  programRow(name: string) {
    return this.page.getByRole('row').filter({ has: this.editProgramButton(name) });
  }

  async scrollProgramNameIntoView(name: string): Promise<void> {
    await this.programNameText(name).scrollIntoViewIfNeeded({ timeout: 45_000 });
  }

  async openNewProgramForm(): Promise<NewProgramModal> {
    await this.newProgramButton.click();
    return new NewProgramModal(this.page);
  }

  async createProgram(name: string, description = '', options?: { reloadAfterCreate?: boolean }): Promise<string | void> {
    const modal = await this.openNewProgramForm();
    await modal.fillProgramName(name);
    if (description) {
      await modal.fillDescription(description);
    }
    if (options?.reloadAfterCreate) {
      return modal.submitCreateWithReload();
    }
    await modal.submitCreateAndWaitForListRefresh();
  }

  async openEditProgram(name: string): Promise<EditProgramModal> {
    await waitUntilDialogsClosed(this.page);
    const edit = this.editProgramButton(name);
    const modal = new EditProgramModal(this.page);
    await edit.scrollIntoViewIfNeeded({ timeout: 45_000 });

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await waitUntilDialogsClosed(this.page);
      try {
        await edit.click({ timeout: 10_000 });
      } catch {
        await this.page.keyboard.press('Escape');
        await waitUntilDialogsClosed(this.page);
        continue;
      }
      try {
        await modal.dialog.waitFor({ state: 'visible', timeout: 5_000 });
        await modal.programNameField.waitFor({ state: 'visible', timeout: 5_000 });
        return modal;
      } catch {
        await this.page.keyboard.press('Escape');
      }
    }

    await modal.dialog.waitFor({ state: 'visible', timeout: 15_000 });
    await modal.programNameField.waitFor({ state: 'visible', timeout: 15_000 });
    return modal;
  }

  trackReloads(): () => number {
    let reloads = 0;
    this.page.on('load', () => {
      reloads += 1;
    });
    return () => reloads;
  }

  async respondToDeleteConfirmation(name: string, accept: boolean): Promise<string> {
    const button = this.deleteProgramButton(name);
    await button.scrollIntoViewIfNeeded({ timeout: 45_000 });
    const dialogMessage = new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Delete confirmation did not appear')), 15_000);
      this.page.once('dialog', async (dialog) => {
        clearTimeout(timer);
        const message = dialog.message();
        if (accept) await dialog.accept();
        else await dialog.dismiss();
        resolve(message);
      });
    });
    await button.click();
    return dialogMessage;
  }

  async confirmDeleteProgram(name: string): Promise<string> {
    const deleted = this.page.waitForResponse((response) => isProgramItemResponse(response, 'DELETE'));
    const message = await this.respondToDeleteConfirmation(name, true);
    await deleted;
    return message;
  }

  async getRowIndexesForProgramNames(names: string[]): Promise<number[]> {
    return this.page.evaluate((expected) => {
      const rows = [...document.querySelectorAll('tbody tr')];
      return expected.map((name) => rows.findIndex((row) => row.textContent?.includes(name)));
    }, names);
  }

  async getProgramListMetrics(): Promise<{ rows: number; scrolls: boolean }> {
    return this.page.evaluate(() => ({
      rows: document.querySelectorAll('tbody tr').length,
      scrolls: document.documentElement.scrollHeight > window.innerHeight,
    }));
  }
}
