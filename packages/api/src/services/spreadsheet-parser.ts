import type { ColumnMappingConfig, ParsedRow } from '../types.js';

export async function parseSpreadsheet(
  _filePath: string,
  _mapping: ColumnMappingConfig,
): Promise<ParsedRow[]> {
  throw new Error('Not implemented yet — TDD RED phase');
}
