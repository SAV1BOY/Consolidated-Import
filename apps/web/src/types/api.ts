export interface Supplier {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

export interface Item {
  id: number;
  code: number;
  description: string;
  supplierId: number;
  costFobUsd: number;
  createdAt: string;
  updatedAt: string;
  supplier: Supplier;
}

export interface LineItem {
  id: number;
  consolidationId: number;
  itemId: number;
  stockPhysical: number;
  stockAvailable: number;
  monthlyAvg: number;
  stockDuration: number;
  suggestedQty: number;
  decidedQty: number | null;
  totalFobUsd: number;
  totalFobBrl: number;
  totalNationalized: number;
  abcClass: string | null;
  createdAt: string;
  updatedAt: string;
  item: {
    code: number;
    description: string;
    costFobUsd: number;
    supplier: { name: string };
  };
}

export interface Consolidation {
  id: number;
  meetingNumber: number;
  totalMeetings: number;
  meetingDate: string;
  description: string | null;
  exchangeRate: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  lineItems?: LineItem[];
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

export interface SpreadsheetPreview {
  headers: string[];
  sampleRows: string[][];
  totalRows: number;
  suggestedMapping: Record<string, string>;
  fileId: string;
}

export interface MergeReport {
  newItems: number;
  updatedItems: number;
  newSuppliers: number;
  errors: { row: number; field: string; message: string }[];
  lineItemsCreated: number;
}

export interface CompareResult {
  added: LineItem[];
  removed: LineItem[];
  changed: LineItem[];
}

export interface AuditLogEntry {
  id: number;
  consolidationId: number | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
}

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
