import type { DashboardKPIs, ABCItem, RiskItem } from '../types.js';

interface LineItemInput {
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
  _lineItems: LineItemInput[],
  _exchangeRate: number,
): DashboardKPIs {
  throw new Error('Not implemented yet — TDD RED phase');
}

export function calculateABC(_lineItems: LineItemInput[]): ABCItem[] {
  throw new Error('Not implemented yet — TDD RED phase');
}

export function identifyRiskItems(
  _lineItems: LineItemInput[],
  _thresholdMonths?: number,
): RiskItem[] {
  throw new Error('Not implemented yet — TDD RED phase');
}

export function calculateSupplierConcentration(
  _lineItems: LineItemInput[],
): Array<{
  supplier: string;
  totalValue: number;
  percentage: number;
  cumulativePercentage: number;
  itemCount: number;
}> {
  throw new Error('Not implemented yet — TDD RED phase');
}
