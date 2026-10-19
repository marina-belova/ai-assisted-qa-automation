import type { Page } from '@playwright/test';
import { waitUntilDialogsClosed } from './dialog-sync';
import { isProgramItemResponse } from './program-api';

export class EditProgramModal {
  readonly dialog;
  readonly heading;
  readonly programNameField;
  readonly descriptionField;
  readonly saveButton;
  readonly cancelButton;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Edit Program' });
    this.heading = this.dialog.getByRole('heading', { name: 'Edit Program' });
    this.programNameField = this.dialog.getByLabel('Program Name');
    this.descriptionField = this.dialog.getByLabel('Description');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programNameField.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionField.fill(description);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async dismissWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async submitEdit(): Promise<void> {
    const saved = this.page.waitForResponse((response) => isProgramItemResponse(response, 'PATCH'));
    await this.clickSave();
    await saved;
    await this.dialog.waitFor({ state: 'hidden', timeout: 30_000 });
    await waitUntilDialogsClosed(this.page);
  }

  async submitEditWithoutWaitingForHidden(): Promise<void> {
    const saved = this.page.waitForResponse((response) => isProgramItemResponse(response, 'PATCH'));
    await this.clickSave();
    await saved;
  }
}
