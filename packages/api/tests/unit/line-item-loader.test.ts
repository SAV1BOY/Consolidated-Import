import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock prisma
vi.mock('../../src/db', () => ({
  prisma: {
    consolidationLineItem: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '../../src/db';
import { getLineItemInputs } from '../../src/services/line-item-loader';

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

describe('LineItemLoader', () => {
  beforeEach(() => {
    vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue(mockLineItems as any);
  });

  describe('getLineItemInputs(consolidationId)', () => {
    it('should return array of LineItemInput objects', async () => {
      const inputs = await getLineItemInputs(1);
      expect(inputs).toBeInstanceOf(Array);
      expect(inputs.length).toBe(2);
    });

    it('should map fields correctly from prisma result', async () => {
      const inputs = await getLineItemInputs(1);
      const first = inputs[0];

      expect(first.itemId).toBe(1);
      expect(first.code).toBe(146874);
      expect(first.description).toBe('iLed - S 2700');
      expect(first.supplier).toBe('HUA FENG');
      expect(first.costFobUsd).toBe(8.75);
      expect(first.totalFobUsd).toBe(5250);
      expect(first.totalFobBrl).toBe(27946.8);
      expect(first.nationalizedValue).toBe(55893.6);
      expect(first.stockAvailable).toBe(0);
      expect(first.monthlyAvg).toBe(0);
      expect(first.stockDuration).toBe(0);
      expect(first.suggestedQty).toBe(600);
    });

    it('should use decidedQty when available, suggestedQty as fallback', async () => {
      const inputs = await getLineItemInputs(1);

      // First item: decidedQty is null → use suggestedQty (600)
      expect(inputs[0].quantity).toBe(600);

      // Second item: decidedQty is 1200 → use decidedQty
      expect(inputs[1].quantity).toBe(1200);
    });

    it('should call prisma with correct consolidationId and includes', async () => {
      await getLineItemInputs(42);
      expect(prisma.consolidationLineItem.findMany).toHaveBeenCalledWith({
        where: { consolidationId: 42 },
        include: { item: { include: { supplier: true } } },
      });
    });

    it('should return empty array when no line items exist', async () => {
      vi.mocked(prisma.consolidationLineItem.findMany).mockResolvedValue([]);
      const inputs = await getLineItemInputs(1);
      expect(inputs).toEqual([]);
    });
  });
});
