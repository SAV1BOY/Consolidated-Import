import type { ParsedRow, MergeReport } from '../types.js';

export async function mergeItems(
  _consolidationId: number,
  _parsedRows: ParsedRow[],
  _existingCodes?: number[],
): Promise<MergeReport> {
  throw new Error('Not implemented yet — TDD RED phase');
}
