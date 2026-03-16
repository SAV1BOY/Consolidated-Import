export interface ColumnMappingConfig {
  code: string;
  description: string;
  supplier: string;
  costFobUsd: string;
  suggestedQty: string;
  stockPhysical?: string;
  stockAvailable?: string;
  monthlyAvg?: string;
  stockDuration?: string;
  totalFobUsd?: string;
  totalFobBrl?: string;
  totalNationalized?: string;
}

export interface ParsedRow {
  code: number;
  description: string;
  supplier: string;
  costFobUsd: number;
  suggestedQty: number;
  stockPhysical: number;
  stockAvailable: number;
  monthlyAvg: number;
  stockDuration: number;
  totalFobUsd: number;
  totalFobBrl: number;
  totalNationalized: number;
}

export interface SpreadsheetPreview {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
}

export interface MergeReport {
  newItems: number;
  updatedItems: number;
  newSuppliers: number;
  errors: MergeError[];
  lineItemsCreated: number;
}

export interface MergeError {
  row: number;
  field: string;
  message: string;
}

export interface DashboardKPIs {
  totalItems: number;
  itemsWithPurchase: number;
  totalSuppliers: number;
  activeSuppliers: number;
  totalQuantity: number;
  totalFobUsd: number;
  totalFobBrl: number;
  totalNationalized: number;
  avgCostPerUnit: number;
  exchangeRate: number;
}

export interface ABCItem {
  itemId: number;
  code: number;
  description: string;
  supplier: string;
  quantity: number;
  nationalizedValue: number;
  percentage: number;
  cumulativePercentage: number;
  abcClass: 'A' | 'B' | 'C';
}

export interface RiskItem {
  itemId: number;
  code: number;
  description: string;
  supplier: string;
  stockAvailable: number;
  monthlyAvg: number;
  stockDuration: number;
  suggestedQty: number;
}
