import type { ColumnMappingConfig, SpreadsheetPreview } from '../types.js';

export async function getPreview(
  _filePath: string,
  _rows?: number,
): Promise<SpreadsheetPreview> {
  throw new Error('Not implemented yet — TDD RED phase');
}

export function detectColumns(
  _headers: string[],
): Partial<ColumnMappingConfig> {
  throw new Error('Not implemented yet — TDD RED phase');
}

export function validateMapping(
  _mapping: Partial<ColumnMappingConfig>,
): { valid: boolean; errors: string[] } {
  throw new Error('Not implemented yet — TDD RED phase');
}
