import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { generatePDF } from '../../src/services/pdf-exporter';

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
];

describe('PDFExporter', () => {
  beforeEach(() => {
    vi.mocked(prisma.consolidation.findUnique).mockResolvedValue(mockConsolidation as any);
    vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue(mockLineItems as any);
  });

  describe('generatePDF(consolidationId)', () => {
    it('should return a valid PDF Buffer', async () => {
      const buffer = await generatePDF(1);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it('should generate a valid PDF (starts with %PDF header)', async () => {
      const buffer = await generatePDF(1);
      const header = buffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('should generate non-trivial PDF content (> 1KB)', async () => {
      const buffer = await generatePDF(1);
      expect(buffer.length).toBeGreaterThan(1024);
    });

    it('should throw error when consolidation not found', async () => {
      vi.mocked(prisma.consolidation.findUnique).mockResolvedValue(null);
      await expect(generatePDF(999)).rejects.toThrow('Consolidation not found');
    });

    it('should handle consolidation with no line items', async () => {
      vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue([]);

      const buffer = await generatePDF(1);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      // Should still start with PDF header
      const header = buffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });

    it('should contain PDF metadata from PDFKit', async () => {
      const buffer = await generatePDF(1);
      const content = buffer.toString('latin1');
      // PDFKit embeds creator info
      expect(content).toContain('PDFKit');
    });

    it('should generate a multi-page or content-rich PDF', async () => {
      const buffer = await generatePDF(1);
      // With items + KPIs, the PDF should be substantial
      expect(buffer.length).toBeGreaterThan(500);
    });

    it('should handle consolidation without description', async () => {
      vi.mocked(prisma.consolidation.findUnique).mockResolvedValue({
        ...mockConsolidation,
        description: null,
      } as any);

      const buffer = await generatePDF(1);
      expect(buffer).toBeInstanceOf(Buffer);
      const header = buffer.subarray(0, 5).toString('ascii');
      expect(header).toBe('%PDF-');
    });
  });
});
