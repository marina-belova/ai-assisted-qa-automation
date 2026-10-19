import {
  captureTokenFromLogin,
  deleteProgram,
  fetchProgramIds,
} from '../../fixtures/didaxis-auth';

/** Maximum programs removable in one manual invocation (no delete-all). */
export const MAX_MANUAL_DELETE_COUNT = 300;

export function parseManualDeleteCount(raw: string | undefined): number {
  const count = raw ? parseInt(raw, 10) : NaN;
  if (!Number.isFinite(count) || count < 1 || count > MAX_MANUAL_DELETE_COUNT) {
    throw new Error(
      `--count must be an integer from 1 to ${MAX_MANUAL_DELETE_COUNT} (examples: 10, 100, 300).`,
    );
  }
  return count;
}

export async function runManualProgramCleanup(requestedCount: number): Promise<void> {
  const { token: initialToken, programIds } = await fetchProgramIds();
  const catalogIds = [...programIds];

  if (catalogIds.length === 0) {
    console.log('GET /api/programs returned no programs; nothing to delete.');
    return;
  }

  if (requestedCount >= catalogIds.length) {
    if (requestedCount === catalogIds.length) {
      throw new Error(
        `Refusing delete-all: --count matches the full catalog (${catalogIds.length} program(s)).`,
      );
    }
    throw new Error(
      `Requested ${requestedCount} deletions but only ${catalogIds.length} program(s) exist.`,
    );
  }

  const idsToDelete = catalogIds.slice(0, requestedCount);
  let token = initialToken;

  console.log(
    `Manual cleanup: deleting ${idsToDelete.length} of ${catalogIds.length} program(s) from the API list.`,
  );

  let deleted = 0;
  for (const id of idsToDelete) {
    let response = await deleteProgram(id, token);
    if (response.status === 401) {
      token = await captureTokenFromLogin();
      response = await deleteProgram(id, token);
    }
    if (!response.ok) {
      throw new Error(`DELETE /api/programs/${id} failed: ${response.status}`);
    }
    deleted += 1;
    console.log(`Deleted ${deleted}/${idsToDelete.length}: ${id}`);
  }

  console.log(`Manual cleanup finished. Deleted ${deleted} program(s).`);
}
