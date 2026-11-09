import type { Page } from '@playwright/test';

export class NewSemesterModal {
  readonly dialog;
  readonly semesterNameField;
  readonly startDateField;
  readonly endDateField;
  readonly createButton;
  readonly cancelButton;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'New Semester', level: 2 }),
    });
    this.semesterNameField = this.dialog.getByRole('textbox', { name: 'Semester Name' });
    this.startDateField = this.dialog.getByRole('textbox', { name: 'Start Date' });
    this.endDateField = this.dialog.getByRole('textbox', { name: 'End Date' });
    this.createButton = this.dialog.getByRole('button', { name: 'Create Semester' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fillSemesterName(name: string): Promise<void> {
    await this.semesterNameField.fill(name);
  }

  async fillStartDate(value: string): Promise<void> {
    await this.startDateField.fill(value);
  }

  async fillEndDate(value: string): Promise<void> {
    await this.endDateField.fill(value);
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }
}
