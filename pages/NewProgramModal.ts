import type { Page } from '@playwright/test';
import { waitUntilDialogsClosed } from './dialog-sync';
import { isProgramsResponse } from './program-api';

export class NewProgramModal {
  readonly dialog;
  readonly programNameField;
  readonly descriptionField;
  readonly createButton;
  readonly cancelButton;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programNameField = this.dialog.getByLabel('Program Name');
    this.descriptionField = this.dialog.getByLabel('Description');
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programNameField.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionField.fill(description);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async dismissWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async submitCreateWithReload(): Promise<string> {
    const created = this.page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await this.clickCreate();
    const response = await created;
    const body = (await response.json()) as { data?: { id?: string } };
    const uuid = body.data?.id;
    if (!uuid) {
      throw new Error('Create program response did not include data.id');
    }
    await this.dialog.waitFor({ state: 'hidden', timeout: 15_000 });
    await waitUntilDialogsClosed(this.page);
    await this.page.reload();
    await this.page.getByRole('button', { name: '+ New Program', exact: true }).waitFor({ state: 'visible' });
    return uuid;
  }

  async submitCreateAndWaitForListRefresh(): Promise<void> {
    const created = this.page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    const refreshed = this.page.waitForResponse((response) => isProgramsResponse(response, 'GET'), {
      timeout: 60_000,
    });
    await this.clickCreate();
    await created;
    await this.dialog.waitFor({ state: 'hidden', timeout: 30_000 });
    await refreshed;
    await waitUntilDialogsClosed(this.page);
  }

  async submitCreateForPostOnly(): Promise<void> {
    const created = this.page.waitForResponse((response) => isProgramsResponse(response, 'POST'));
    await this.clickCreate();
    await created;
  }
}
