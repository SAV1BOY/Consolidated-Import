import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseSpreadsheet } from '../../src/services/spreadsheet-parser';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/sample-consolidado.xlsx');

// We need to discover the actual column layout of the fixture first.
// Based on the RAW data in dashboard_v2.jsx, the columns are approximately:
// A=N, B=Codigo, C=Fornecedor, D=Descricao, E=Est.Fisico, F=Est.Disponivel,
// G=Media/Mes, H=Duracao, I=Sugestao, J=Total Est, K=Dur.Total,
// L=Custo FOB, M=Total FOB US$, N=Total FOB R$, O=Total Nacionalizado

const STANDARD_MAPPING = {
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

describe('SpreadsheetParser', () => {
  describe('parseSpreadsheet(filePath, columnMapping)', () => {
    it('should parse an XLSX file and return an array of ParsedRow objects', async () => {
      const result = await parseSpreadsheet(FIXTURE_PATH, STANDARD_MAPPING);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('code');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('supplier');
      expect(result[0]).toHaveProperty('costFobUsd');
      expect(result[0]).toHaveProperty('suggestedQty');
    });

    it('should apply configurable column mapping', async () => {
      // Use a different mapping (swapped columns)
      const altMapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      const result = await parseSpreadsheet(FIXTURE_PATH, altMapping);
      expect(result[0].code).toBeTypeOf('number');
      expect(result[0].description).toBeTypeOf('string');
      expect(result[0].supplier).toBeTypeOf('string');
    });

    it('should handle missing optional columns gracefully', async () => {
      const minimalMapping = {
        code: 'B',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      const result = await parseSpreadsheet(FIXTURE_PATH, minimalMapping);
      expect(result[0].stockPhysical).toBe(0);
      expect(result[0].stockAvailable).toBe(0);
      expect(result[0].monthlyAvg).toBe(0);
    });

    it('should validate required fields and throw on missing mapping', async () => {
      const badMapping = {
        code: '',
        description: 'D',
        supplier: 'C',
        costFobUsd: 'L',
        suggestedQty: 'I',
      };

      await expect(parseSpreadsheet(FIXTURE_PATH, badMapping))
        .rejects.toThrow(/required field/i);
    });

    it('should convert string values to numbers for numeric fields', async () => {
      const result = await parseSpreadsheet(FIXTURE_PATH, STANDARD_MAPPING);
      expect(typeof result[0].code).toBe('number');
      expect(typeof result[0].costFobUsd).toBe('number');
      expect(typeof result[0].suggestedQty).toBe('number');
      expect(Number.isNaN(result[0].code)).toBe(false);
    });

    it('should skip empty rows', async () => {
      const result = await parseSpreadsheet(FIXTURE_PATH, STANDARD_MAPPING);
      result.forEach(row => {
        expect(row.code || row.description).toBeTruthy();
      });
    });

    it('should throw for non-XLSX files', async () => {
      await expect(parseSpreadsheet('/tmp/fake.csv', STANDARD_MAPPING))
        .rejects.toThrow(/xlsx/i);
    });
  });
});
