import { prisma } from '../db.js';
import type { LineItemInput } from './metrics-calculator.js';

export async function getLineItemInputs(consolidationId: number): Promise<LineItemInput[]> {
  const lineItems = await prisma.consolidationLineItem.findMany({
    where: { consolidationId },
    include: { item: { include: { supplier: true } } },
  });

  return lineItems.map(li => ({
    itemId: li.itemId,
    code: li.item.code,
    description: li.item.description,
    supplier: li.item.supplier.name,
    quantity: li.decidedQty ?? li.suggestedQty,
    nationalizedValue: li.totalNationalized,
    costFobUsd: li.item.costFobUsd,
    totalFobUsd: li.totalFobUsd,
    totalFobBrl: li.totalFobBrl,
    stockAvailable: li.stockAvailable,
    monthlyAvg: li.monthlyAvg,
    stockDuration: li.stockDuration,
    suggestedQty: li.suggestedQty,
  }));
}
