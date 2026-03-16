import { describe, it, expect } from 'vitest';
import { mergeItems } from '../../src/services/merge-engine';
import type { ParsedRow } from '../../src/types';

const sampleRows: ParsedRow[] = [
  {
    code: 240570,
    description: 'VIDRO ICE PEQUENO',
    supplier: 'BO GLASS INDUSTRIAL LIMITED',
    costFobUsd: 25.0,
    suggestedQty: 0,
    stockPhysical: 141,
    stockAvailable: 136,
    monthlyAvg: 4.0,
    stockDuration: 34.0,
    totalFobUsd: 0,
    totalFobBrl: 0,
    totalNationalized: 0,
  },
  {
    code: 999999,
    description: 'NOVO ITEM DE TESTE',
    supplier: 'NOVO FORNECEDOR',
    costFobUsd: 10.0,
    suggestedQty: 100,
    stockPhysical: 0,
    stockAvailable: 0,
    monthlyAvg: 50,
    stockDuration: 0,
    totalFobUsd: 1000,
    totalFobBrl: 5323.2,
    totalNationalized: 10646.4,
  },
  {
    code: 146874,
    description: 'iLed - S 2700',
    supplier: 'HUA FENG',
    costFobUsd: 8.75,
    suggestedQty: 600,
    stockPhysical: 0,
    stockAvailable: 0,
    monthlyAvg: 0,
    stockDuration: 0,
    totalFobUsd: 5250,
    totalFobBrl: 27946.8,
    totalNationalized: 55893.6,
  },
];

describe('MergeEngine', () => {
  describe('mergeItems(parsedRows, existingCodes, existingSuppliers)', () => {
    it('should detect new items (code not in database)', () => {
      const existingCodes = [240570, 146874];
      const result = mergeItems(sampleRows, existingCodes);
      expect(result.report.newItems).toBe(1);
      expect(result.report.updatedItems).toBe(2);
    });

    it('should create supplier record if supplier does not exist', () => {
      const existingSuppliers = ['BO GLASS INDUSTRIAL LIMITED', 'HUA FENG'];
      const result = mergeItems(sampleRows, [], existingSuppliers);
      expect(result.report.newSuppliers).toBe(1);
      expect(result.newSupplierNames).toContain('NOVO FORNECEDOR');
    });

    it('should merge existing items with updated data', () => {
      const existingCodes = [240570, 146874];
      const result = mergeItems(sampleRows, existingCodes);
      expect(result.report.updatedItems).toBe(2);
      expect(result.updatedItemRows.length).toBe(2);
    });

    it('should return a complete merge report', () => {
      const result = mergeItems(sampleRows, [240570]);
      expect(result.report).toHaveProperty('newItems');
      expect(result.report).toHaveProperty('updatedItems');
      expect(result.report).toHaveProperty('newSuppliers');
      expect(result.report).toHaveProperty('errors');
      expect(result.report).toHaveProperty('lineItemsCreated');
      expect(result.report.lineItemsCreated).toBe(3);
    });

    it('should handle duplicate codes in the same spreadsheet', () => {
      const duplicateRows: ParsedRow[] = [
        { ...sampleRows[0] },
        { ...sampleRows[0] },
      ];

      const result = mergeItems(duplicateRows, []);
      expect(result.report.errors.length).toBeGreaterThan(0);
    });

    it('should create line items for all valid rows', () => {
      const result = mergeItems(sampleRows, []);
      expect(result.report.lineItemsCreated).toBe(3);
      expect(result.report.errors).toHaveLength(0);
    });

    it('should report errors for rows with invalid data', () => {
      const invalidRows: ParsedRow[] = [
        {
          ...sampleRows[0],
          code: NaN,
        },
      ];

      const result = mergeItems(invalidRows, []);
      expect(result.report.errors.length).toBeGreaterThan(0);
      expect(result.report.errors[0].field).toBe('code');
    });
  });
});
