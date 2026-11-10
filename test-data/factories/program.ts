import { faker } from '@faker-js/faker';
import { uniqueName } from '../../utils/test-data';

/**
 * Happy-path input for the New Program dialog.
 * `name` is the Program Name field. `description` is the Description field.
 * The create response's `data.id` is assigned by the API, so this draft does not invent one.
 */
export type ProgramDraft = {
  name: string;
  description: string;
};

/** Program Name length accepted by the current name-rule specs. */
const programNameMinLength = 1;
const programNameMaxLength = 255;

/**
 * Builds one Program draft. No spec imports this yet.
 * The name goes through `uniqueName()` so a later test can create it without colliding.
 */
export function buildProgram(overrides: Partial<ProgramDraft> = {}): ProgramDraft {
  const name = overrides.name ?? uniqueName(faker.commerce.department());
  const description = overrides.description ?? faker.lorem.sentence();

  if (name.length < programNameMinLength || name.length > programNameMaxLength) {
    throw new Error(
      `Program name length ${name.length} is outside ${programNameMinLength}-${programNameMaxLength}`,
    );
  }

  return { name, description };
}
