import type { DashboardKPIs, ABCItem, RiskItem } from '../types.js';

export interface LineItemInput {
  itemId: number;
  code: number;
  description: string;
  supplier: string;
  quantity: number;
  nationalizedValue: number;
  costFobUsd: number;
  totalFobUsd: number;
  totalFobBrl: number;
  stockAvailable: number;
  monthlyAvg: number;
  stockDuration: number;
  suggestedQty: number;
}

export function calculateKPIs(
  lineItems: LineItemInput[],
  exchangeRate: number,
): DashboardKPIs {
  const itemsWithPurchase = lineItems.filter(i => i.suggestedQty > 0);
  const suppliers = new Set(lineItems.map(i => i.supplier));
  const activeSuppliers = new Set(itemsWithPurchase.map(i => i.supplier));

  const totalQuantity = lineItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalFobUsd = lineItems.reduce((sum, i) => sum + i.totalFobUsd, 0);
  const totalFobBrl = lineItems.reduce((sum, i) => sum + i.totalFobBrl, 0);
  const totalNationalized = lineItems.reduce((sum, i) => sum + i.nationalizedValue, 0);
  const avgCostPerUnit = totalQuantity > 0 ? totalNationalized / totalQuantity : 0;

  return {
    totalItems: lineItems.length,
    itemsWithPurchase: itemsWithPurchase.length,
    totalSuppliers: suppliers.size,
    activeSuppliers: activeSuppliers.size,
    totalQuantity,
    totalFobUsd,
    totalFobBrl,
    totalNationalized,
    avgCostPerUnit,
    exchangeRate,
  };
}

export function calculateABC(lineItems: LineItemInput[]): ABCItem[] {
  if (lineItems.length === 0) return [];

  const totalValue = lineItems.reduce((sum, i) => sum + i.nationalizedValue, 0);
  if (totalValue === 0) return [];

  const sorted = [...lineItems].sort((a, b) => b.nationalizedValue - a.nationalizedValue);

  let cumulative = 0;
  return sorted.map(item => {
    const percentage = (item.nationalizedValue / totalValue) * 100;
    cumulative += percentage;

    let abcClass: 'A' | 'B' | 'C';
    if (cumulative <= 80) {
      abcClass = 'A';
    } else if (cumulative <= 95) {
      abcClass = 'B';
    } else {
      abcClass = 'C';
    }

    return {
      itemId: item.itemId,
      code: item.code,
      description: item.description,
      supplier: item.supplier,
      quantity: item.quantity,
      nationalizedValue: item.nationalizedValue,
      percentage,
      cumulativePercentage: cumulative,
      abcClass,
    };
  });
}

export function identifyRiskItems(
  lineItems: LineItemInput[],
  thresholdMonths: number = 3,
): RiskItem[] {
  return lineItems
    .filter(i => i.stockDuration < thresholdMonths)
    .sort((a, b) => a.stockDuration - b.stockDuration)
    .map(i => ({
      itemId: i.itemId,
      code: i.code,
      description: i.description,
      supplier: i.supplier,
      stockAvailable: i.stockAvailable,
      monthlyAvg: i.monthlyAvg,
      stockDuration: i.stockDuration,
      suggestedQty: i.suggestedQty,
    }));
}

export function calculateSupplierConcentration(
  lineItems: LineItemInput[],
): Array<{
  supplier: string;
  totalValue: number;
  percentage: number;
  cumulativePercentage: number;
  itemCount: number;
}> {
  const totalValue = lineItems.reduce((sum, i) => sum + i.nationalizedValue, 0);
  if (totalValue === 0) return [];

  const supplierMap = new Map<string, { totalValue: number; itemCount: number }>();
  for (const item of lineItems) {
    const existing = supplierMap.get(item.supplier) || { totalValue: 0, itemCount: 0 };
    existing.totalValue += item.nationalizedValue;
    existing.itemCount += 1;
    supplierMap.set(item.supplier, existing);
  }

  const sorted = Array.from(supplierMap.entries())
    .map(([supplier, data]) => ({
      supplier,
      totalValue: data.totalValue,
      percentage: (data.totalValue / totalValue) * 100,
      cumulativePercentage: 0,
      itemCount: data.itemCount,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  let cumulative = 0;
  for (const entry of sorted) {
    cumulative += entry.percentage;
    entry.cumulativePercentage = cumulative;
  }

  return sorted;
}
