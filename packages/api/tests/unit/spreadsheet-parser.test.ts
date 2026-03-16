import { describe, it, expect } from 'vitest';
import path from 'path';

// Service to be implemented in src/services/spreadsheet-parser.ts
// import { parseSpreadsheet } from '../../src/services/spreadsheet-parser';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/sample-consolidado.xlsx');

describe('SpreadsheetParser', () => {
  describe('parseSpreadsheet(filePath, columnMapping)', () => {
    it('should parse an XLSX file and return an array of ParsedRow objects', async () => {
      const mapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
        stockPhysical: 'E',
        stockAvailable: 'F',
        monthlyAvg: 'G',
        stockDuration: 'H',
        totalFobUsd: 'M',
        totalFobBrl: 'N',
        totalNationalized: 'O',
      };

      // const result = await parseSpreadsheet(FIXTURE_PATH, mapping);
      // expect(Array.isArray(result)).toBe(true);
      // expect(result.length).toBeGreaterThan(0);
      // expect(result[0]).toHaveProperty('code');
      // expect(result[0]).toHaveProperty('description');
      // expect(result[0]).toHaveProperty('supplier');
      // expect(result[0]).toHaveProperty('costFobUsd');
      // expect(result[0]).toHaveProperty('suggestedQty');
      expect(true).toBe(false); // RED: test must fail until implemented
    });

    it('should apply configurable column mapping', async () => {
      // Different mapping where columns are in different positions
      const mapping = {
        code: 'A',
        description: 'C',
        supplier: 'B',
        costFobUsd: 'F',
        suggestedQty: 'E',
      };

      // const result = await parseSpreadsheet(FIXTURE_PATH, mapping);
      // expect(result[0].code).toBeTypeOf('number');
      // expect(result[0].description).toBeTypeOf('string');
      // expect(result[0].supplier).toBeTypeOf('string');
      expect(true).toBe(false); // RED
    });

    it('should handle missing optional columns gracefully', async () => {
      // Mapping with only required fields
      const mapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      // const result = await parseSpreadsheet(FIXTURE_PATH, mapping);
      // expect(result[0].stockPhysical).toBe(0); // default to 0
      // expect(result[0].stockAvailable).toBe(0);
      // expect(result[0].monthlyAvg).toBe(0);
      expect(true).toBe(false); // RED
    });

    it('should validate required fields and throw on missing data', async () => {
      const mapping = {
        code: 'Z', // column that doesn't exist
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      // await expect(parseSpreadsheet(FIXTURE_PATH, mapping))
      //   .rejects.toThrow(/required field.*code/i);
      expect(true).toBe(false); // RED
    });

    it('should convert string values to numbers for numeric fields', async () => {
      const mapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      // const result = await parseSpreadsheet(FIXTURE_PATH, mapping);
      // expect(typeof result[0].code).toBe('number');
      // expect(typeof result[0].costFobUsd).toBe('number');
      // expect(typeof result[0].suggestedQty).toBe('number');
      // expect(Number.isNaN(result[0].code)).toBe(false);
      expect(true).toBe(false); // RED
    });

    it('should skip empty rows', async () => {
      const mapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      // const result = await parseSpreadsheet(FIXTURE_PATH, mapping);
      // All returned rows should have a valid code
      // result.forEach(row => {
      //   expect(row.code).toBeTruthy();
      //   expect(row.description).toBeTruthy();
      // });
      expect(true).toBe(false); // RED
    });

    it('should throw for non-XLSX files', async () => {
      const mapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      // await expect(parseSpreadsheet('/tmp/fake.csv', mapping))
      //   .rejects.toThrow(/xlsx/i);
      expect(true).toBe(false); // RED
    });
  });
});
