import ExcelJS from 'exceljs';
import type { ColumnMappingConfig, SpreadsheetPreview } from '../types.js';

const REQUIRED_FIELDS: (keyof ColumnMappingConfig)[] = [
  'code', 'description', 'supplier', 'costFobUsd', 'suggestedQty',
];

const HEADER_PATTERNS: Record<keyof ColumnMappingConfig, RegExp[]> = {
  code: [/c[oó]d/i, /^codigo$/i, /^cod\.?$/i, /item.*code/i],
  description: [/descri[cç]/i, /^descricao$/i, /item.*name/i, /produto/i],
  supplier: [/fornec/i, /^supplier/i, /^fornec\.?$/i],
  costFobUsd: [/custo.*fob/i, /cost.*fob/i, /fob.*us\$/i, /custo.*unit/i],
  suggestedQty: [/sugest/i, /suggested/i, /qtde?\s*sug/i, /compra/i],
  stockPhysical: [/est.*f[ií]s/i, /physical.*stock/i],
  stockAvailable: [/est.*dispon/i, /available.*stock/i, /dispon[ií]vel/i],
  monthlyAvg: [/m[eé]dia.*m(ens|[eê]s)/i, /monthly.*avg/i, /m[eé]dia/i],
  stockDuration: [/dura[cç][aã]o.*est/i, /stock.*duration/i, /dura[cç][aã]o/i],
  totalFobUsd: [/total.*fob.*us/i, /total.*fob.*\$/i],
  totalFobBrl: [/total.*fob.*r\$/i, /total.*fob.*brl/i],
  totalNationalized: [/nacionaliz/i, /nationalized/i, /total.*nac/i],
};

function columnIndexToLetter(index: number): string {
  let letter = '';
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

export async function getPreview(
  filePath: string,
  rows: number = 5,
): Promise<SpreadsheetPreview> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('No worksheet found in the XLSX file');
  }

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    while (headers.length < colNumber - 1) headers.push('');
    headers.push(cell.text || '');
  });

  const sampleRows: string[][] = [];
  const maxRow = Math.min(rows + 1, worksheet.rowCount);
  for (let i = 2; i <= maxRow; i++) {
    const row = worksheet.getRow(i);
    const rowData: string[] = [];
    for (let j = 1; j <= headers.length; j++) {
      const cell = row.getCell(j);
      rowData.push(cell.text || '');
    }
    sampleRows.push(rowData);
  }

  return {
    headers,
    sampleRows,
    totalRows: worksheet.rowCount - 1,
  };
}

export function detectColumns(
  headers: string[],
): Partial<ColumnMappingConfig> {
  const result: Partial<Record<keyof ColumnMappingConfig, string | null>> = {};

  for (const [field, patterns] of Object.entries(HEADER_PATTERNS)) {
    let found: string | null = null;
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (!header) continue;
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          found = columnIndexToLetter(i);
          break;
        }
      }
      if (found) break;
    }
    result[field as keyof ColumnMappingConfig] = found;
  }

  // Convert null entries: return only detected fields
  const detected: Partial<ColumnMappingConfig> = {};
  for (const [key, value] of Object.entries(result)) {
    if (value !== null) {
      detected[key as keyof ColumnMappingConfig] = value;
    }
  }
  return detected;
}

export function validateMapping(
  mapping: Partial<ColumnMappingConfig>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check for duplicate column assignments
  const assigned = new Map<string, string>();
  for (const [field, column] of Object.entries(mapping)) {
    if (column) {
      if (assigned.has(column)) {
        errors.push(`Duplicate column assignment: column ${column} is mapped to both '${assigned.get(column)}' and '${field}'`);
      } else {
        assigned.set(column, field);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
