import { describe, it, expect } from 'vitest';
import path from 'path';
import { detectColumns, getPreview, validateMapping } from '../../src/services/column-mapper';

const FIXTURE_PATH = path.join(__dirname, '../fixtures/sample-consolidado.xlsx');

describe('ColumnMapper', () => {
  describe('getPreview(filePath)', () => {
    it('should return headers and first N sample rows from XLSX', async () => {
      const preview = await getPreview(FIXTURE_PATH, 5);
      expect(preview.headers).toBeInstanceOf(Array);
      expect(preview.headers.length).toBeGreaterThan(0);
      expect(preview.sampleRows).toBeInstanceOf(Array);
      expect(preview.sampleRows.length).toBeLessThanOrEqual(5);
      expect(preview.totalRows).toBeGreaterThan(0);
    });

    it('should return all column headers as strings', async () => {
      const preview = await getPreview(FIXTURE_PATH, 3);
      preview.headers.forEach(header => {
        expect(typeof header).toBe('string');
      });
    });
  });

  describe('detectColumns(headers)', () => {
    it('should auto-detect columns by header name (fuzzy match)', () => {
      const headers = [
        'N', 'Codigo', 'Fornecedor', 'Descricao do Item',
        'Est. Fisico', 'Est. Disponivel', 'Media/Mes',
        'Duracao', 'Sugestao', 'Total Est.', 'Dur. Total',
        'Custo FOB US$', 'TOTAL FOB US$', 'TOTAL FOB R$', 'TOTAL NACIONALIZADO'
      ];

      const detected = detectColumns(headers);
      expect(detected.code).toBe('B');
      expect(detected.supplier).toBe('C');
      expect(detected.description).toBe('D');
      expect(detected.costFobUsd).toBe('L');
      expect(detected.suggestedQty).toBe('I');
    });

    it('should detect columns with Portuguese variations', () => {
      const headers = [
        '#', 'Cod.', 'Fornec.', 'Descrição',
        'Estoque', 'Disponível', 'Média Mensal',
        'Duração (meses)', 'Qtde Sugerida'
      ];

      const detected = detectColumns(headers);
      expect(detected.code).toBeDefined();
      expect(detected.supplier).toBeDefined();
      expect(detected.description).toBeDefined();
    });

    it('should return empty object for columns that cannot be detected', () => {
      const headers = ['A', 'B', 'C', 'D'];
      const detected = detectColumns(headers);
      expect(detected.code).toBeUndefined();
      expect(detected.description).toBeUndefined();
    });
  });

  describe('validateMapping(mapping)', () => {
    it('should accept a mapping with all required fields', () => {
      const mapping = {
        code: 'A',
        description: 'B',
        supplier: 'C',
        costFobUsd: 'D',
        suggestedQty: 'E',
      };

      const result = validateMapping(mapping);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject a mapping missing required fields', () => {
      const mapping = {
        code: 'A',
        description: 'B',
      };

      const result = validateMapping(mapping);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => /supplier/i.test(e))).toBe(true);
    });

    it('should reject duplicate column assignments', () => {
      const mapping = {
        code: 'A',
        description: 'A',
        supplier: 'C',
        costFobUsd: 'D',
        suggestedQty: 'E',
      };

      const result = validateMapping(mapping);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => /duplicate/i.test(e))).toBe(true);
    });
  });
});
