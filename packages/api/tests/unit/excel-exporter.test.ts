import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExcelJS from 'exceljs';

// Mock prisma
vi.mock('../../src/db', () => ({
  prisma: {
    consolidation: {
      findUnique: vi.fn(),
    },
    consolidationLineItem: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/db';
import { generateExcel } from '../../src/services/excel-exporter';

const mockConsolidation = {
  id: 1,
  meetingNumber: 5,
  totalMeetings: 26,
  meetingDate: new Date('2026-03-01'),
  description: 'Reunião de Março',
  exchangeRate: 5.3232,
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockLineItems = [
  {
    id: 1,
    consolidationId: 1,
    itemId: 1,
    suggestedQty: 600,
    decidedQty: null,
    totalFobUsd: 5250,
    totalFobBrl: 27946.8,
    totalNationalized: 55893.6,
    stockAvailable: 0,
    monthlyAvg: 0,
    stockDuration: 0,
    item: {
      id: 1,
      code: 146874,
      description: 'iLed - S 2700',
      costFobUsd: 8.75,
      supplier: { id: 1, name: 'HUA FENG' },
    },
  },
  {
    id: 2,
    consolidationId: 1,
    itemId: 2,
    suggestedQty: 1600,
    decidedQty: 1200,
    totalFobUsd: 2240,
    totalFobBrl: 11923.968,
    totalNationalized: 23847.936,
    stockAvailable: 100,
    monthlyAvg: 200,
    stockDuration: 0.5,
    item: {
      id: 2,
      code: 195514,
      description: 'Driver iLed 500 3-9VDC 600mA',
      costFobUsd: 1.4,
      supplier: { id: 2, name: 'HI ZEALED' },
    },
  },
  {
    id: 3,
    consolidationId: 1,
    itemId: 3,
    suggestedQty: 950,
    decidedQty: null,
    totalFobUsd: 918.65,
    totalFobBrl: 4889.15,
    totalNationalized: 9780.31536,
    stockAvailable: 19,
    monthlyAvg: 100,
    stockDuration: 0.19,
    item: {
      id: 3,
      code: 255344,
      description: 'IMA DE NEODIMIO PERSONALIZADO',
      costFobUsd: 0.967,
      supplier: { id: 3, name: 'U-POLEMAG' },
    },
  },
];

describe('ExcelExporter', () => {
  beforeEach(() => {
    vi.mocked(prisma.consolidation.findUnique).mockResolvedValue(mockConsolidation as any);
    vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue(mockLineItems as any);
  });

  describe('generateExcel(consolidationId)', () => {
    it('should return a valid Buffer', async () => {
      const buffer = await generateExcel(1);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate a workbook with 4 sheets', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      expect(wb.worksheets.length).toBe(4);
      expect(wb.worksheets.map(ws => ws.name)).toEqual([
        'Resumo', 'Itens', 'Pareto ABC', 'Riscos',
      ]);
    });

    it('should include consolidation metadata in Resumo sheet', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const resumo = wb.getWorksheet('Resumo')!;
      const values = resumo.getColumn(1).values as (string | undefined)[];
      const flatValues = values.filter(Boolean).map(String);
      expect(flatValues).toContain('ILUMINAR — Consolidação');
      expect(flatValues.some(v => v.includes('KPIs'))).toBe(true);
    });

    it('should include KPI values in Resumo sheet', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const resumo = wb.getWorksheet('Resumo')!;
      const col1Values = resumo.getColumn(1).values as (string | undefined)[];
      const flatValues = col1Values.filter(Boolean).map(String);
      expect(flatValues).toContain('Total de Itens');
      expect(flatValues).toContain('Total FOB USD');
      expect(flatValues).toContain('Total Nacionalizado');
    });

    it('should include all items in Itens sheet with headers', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const itens = wb.getWorksheet('Itens')!;
      // Header row + 3 item rows
      expect(itens.rowCount).toBe(4);

      const headerRow = itens.getRow(1);
      expect(headerRow.getCell(1).value).toBe('Código');
      expect(headerRow.getCell(2).value).toBe('Descrição');
    });

    it('should classify items with ABC colors in Itens sheet', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const itens = wb.getWorksheet('Itens')!;
      // Row 2 should be the first item (highest value = class A)
      const abcCell = itens.getRow(2).getCell(13);
      expect(abcCell.value).toBe('A');
      expect(abcCell.fill).toBeDefined();
    });

    it('should include Pareto ABC data with percentages', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const pareto = wb.getWorksheet('Pareto ABC')!;
      expect(pareto.rowCount).toBe(4); // header + 3 items

      const headerRow = pareto.getRow(1);
      expect(headerRow.getCell(5).value).toBe('% Individual');
      expect(headerRow.getCell(6).value).toBe('% Acumulada');
      expect(headerRow.getCell(7).value).toBe('Classe');

      // Last item's cumulative should be ~1.0 (100%)
      const lastRow = pareto.getRow(4);
      expect(lastRow.getCell(6).value).toBeCloseTo(1, 1);
    });

    it('should include risk items in Riscos sheet', async () => {
      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      const riscos = wb.getWorksheet('Riscos')!;
      // All 3 items have stockDuration < 3, so all are risk items
      expect(riscos.rowCount).toBe(4); // header + 3

      const headerRow = riscos.getRow(1);
      expect(headerRow.getCell(6).value).toBe('Dur. Estoque (meses)');
    });

    it('should throw error when consolidation not found', async () => {
      vi.mocked(prisma.consolidation.findUnique).mockResolvedValue(null);
      await expect(generateExcel(999)).rejects.toThrow('Consolidation not found');
    });

    it('should handle consolidation with no line items', async () => {
      vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue([]);

      const buffer = await generateExcel(1);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer);

      expect(wb.worksheets.length).toBe(4);
      const itens = wb.getWorksheet('Itens')!;
      expect(itens.rowCount).toBe(1); // only header
    });
  });
});
