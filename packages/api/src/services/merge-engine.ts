import type { ParsedRow, MergeReport, MergeError } from '../types.js';

export interface MergeResult {
  report: MergeReport;
  newItemRows: ParsedRow[];
  updatedItemRows: ParsedRow[];
  newSupplierNames: string[];
}

export function mergeItems(
  parsedRows: ParsedRow[],
  existingCodes: number[] = [],
  existingSuppliers: string[] = [],
): MergeResult {
  const errors: MergeError[] = [];
  const existingCodeSet = new Set(existingCodes);
  const existingSupplierSet = new Set(existingSuppliers.map(s => s.toLowerCase()));

  const newItemRows: ParsedRow[] = [];
  const updatedItemRows: ParsedRow[] = [];
  const newSupplierNames = new Set<string>();
  const seenCodes = new Set<number>();
  let lineItemsCreated = 0;

  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];

    // Validate code
    if (!row.code || Number.isNaN(row.code)) {
      errors.push({
        row: i + 1,
        field: 'code',
        message: `Invalid or missing item code at row ${i + 1}`,
      });
      continue;
    }

    // Check for duplicates within the same spreadsheet
    if (seenCodes.has(row.code)) {
      errors.push({
        row: i + 1,
        field: 'code',
        message: `Duplicate item code ${row.code} at row ${i + 1}`,
      });
      continue;
    }
    seenCodes.add(row.code);

    // Check for new suppliers
    if (row.supplier && !existingSupplierSet.has(row.supplier.toLowerCase())) {
      newSupplierNames.add(row.supplier);
      existingSupplierSet.add(row.supplier.toLowerCase());
    }

    // Classify as new or updated
    if (existingCodeSet.has(row.code)) {
      updatedItemRows.push(row);
    } else {
      newItemRows.push(row);
    }

    lineItemsCreated++;
  }

  return {
    report: {
      newItems: newItemRows.length,
      updatedItems: updatedItemRows.length,
      newSuppliers: newSupplierNames.size,
      errors,
      lineItemsCreated,
    },
    newItemRows,
    updatedItemRows,
    newSupplierNames: Array.from(newSupplierNames),
  };
}
