import ExcelJS from 'exceljs';
import type { ColumnMappingConfig, ParsedRow } from '../types.js';

function columnLetterToIndex(letter: string): number {
  let index = 0;
  for (let i = 0; i < letter.length; i++) {
    index = index * 26 + (letter.charCodeAt(i) - 64);
  }
  return index; // 1-based (A=1, B=2, ...)
}

function getCellValue(row: ExcelJS.Row, columnLetter: string): unknown {
  const colIndex = columnLetterToIndex(columnLetter);
  const cell = row.getCell(colIndex);
  if (cell.value === null || cell.value === undefined) return undefined;
  // Handle formula results
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return cell.value.result;
  }
  return cell.value;
}

function toNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function toString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

export async function parseSpreadsheet(
  filePath: string,
  mapping: ColumnMappingConfig,
  options?: { skipExtensionCheck?: boolean },
): Promise<ParsedRow[]> {
  if (!options?.skipExtensionCheck && !filePath.endsWith('.xlsx')) {
    throw new Error('Invalid file format: only .xlsx files are supported');
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the XLSX file');
  }

  // Validate that required mapping columns exist
  const requiredFields: (keyof ColumnMappingConfig)[] = [
    'code', 'description', 'supplier', 'costFobUsd', 'suggestedQty',
  ];
  for (const field of requiredFields) {
    if (!mapping[field]) {
      throw new Error(`Missing required field mapping: ${field}`);
    }
  }

  // Check if mapped columns have data (test with header row)
  const headerRow = worksheet.getRow(1);
  const maxCol = headerRow.cellCount;
  for (const field of requiredFields) {
    const colIndex = columnLetterToIndex(mapping[field]!);
    if (colIndex > maxCol + 5) {
      throw new Error(`Required field '${field}' maps to column ${mapping[field]} which appears to be out of range`);
    }
  }

  const rows: ParsedRow[] = [];

  // Start from row 2 (skip header)
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);

    const codeRaw = getCellValue(row, mapping.code);
    const descRaw = getCellValue(row, mapping.description);

    // Skip empty rows
    if (codeRaw === undefined && descRaw === undefined) continue;
    if (codeRaw === null && descRaw === null) continue;

    const code = toNumber(codeRaw);
    const description = toString(descRaw);

    // Skip rows without valid code or description
    if (!code && !description) continue;

    const parsed: ParsedRow = {
      code,
      description,
      supplier: toString(getCellValue(row, mapping.supplier)),
      costFobUsd: toNumber(getCellValue(row, mapping.costFobUsd)),
      suggestedQty: toNumber(getCellValue(row, mapping.suggestedQty)),
      stockPhysical: mapping.stockPhysical ? toNumber(getCellValue(row, mapping.stockPhysical)) : 0,
      stockAvailable: mapping.stockAvailable ? toNumber(getCellValue(row, mapping.stockAvailable)) : 0,
      monthlyAvg: mapping.monthlyAvg ? toNumber(getCellValue(row, mapping.monthlyAvg)) : 0,
      stockDuration: mapping.stockDuration ? toNumber(getCellValue(row, mapping.stockDuration)) : 0,
      totalFobUsd: mapping.totalFobUsd ? toNumber(getCellValue(row, mapping.totalFobUsd)) : 0,
      totalFobBrl: mapping.totalFobBrl ? toNumber(getCellValue(row, mapping.totalFobBrl)) : 0,
      totalNationalized: mapping.totalNationalized ? toNumber(getCellValue(row, mapping.totalNationalized)) : 0,
    };

    rows.push(parsed);
  }

  return rows;
}
