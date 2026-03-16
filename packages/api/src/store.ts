import type { ParsedRow } from './types.js';

export interface StoredConsolidation {
  id: number;
  meetingNumber: number;
  totalMeetings: number;
  meetingDate: string;
  description: string | null;
  exchangeRate: number;
  status: string;
  columnMapping: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StoredLineItem {
  id: number;
  consolidationId: number;
  itemId: number;
  code: number;
  description: string;
  supplier: string;
  stockPhysical: number;
  stockAvailable: number;
  monthlyAvg: number;
  stockDuration: number;
  suggestedQty: number;
  decidedQty: number | null;
  costFobUsd: number;
  totalFobUsd: number;
  totalFobBrl: number;
  totalNationalized: number;
  abcClass: string | null;
}

export interface StoredItem {
  id: number;
  code: number;
  description: string;
  supplierId: number;
  costFobUsd: number;
}

export interface StoredSupplier {
  id: number;
  code: string;
  name: string;
}

// In-memory store — will be replaced with Prisma
class Store {
  consolidations: StoredConsolidation[] = [];
  lineItems: StoredLineItem[] = [];
  items: StoredItem[] = [];
  suppliers: StoredSupplier[] = [];

  private nextConsolidationId = 1;
  private nextLineItemId = 1;
  private nextItemId = 1;
  private nextSupplierId = 1;

  clear() {
    this.consolidations = [];
    this.lineItems = [];
    this.items = [];
    this.suppliers = [];
    this.nextConsolidationId = 1;
    this.nextLineItemId = 1;
    this.nextItemId = 1;
    this.nextSupplierId = 1;
  }

  createConsolidation(data: Omit<StoredConsolidation, 'id' | 'createdAt' | 'updatedAt'>): StoredConsolidation {
    const consolidation: StoredConsolidation = {
      ...data,
      id: this.nextConsolidationId++,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.consolidations.push(consolidation);
    return consolidation;
  }

  getOrCreateSupplier(name: string): StoredSupplier {
    const existing = this.suppliers.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) return existing;
    const supplier: StoredSupplier = {
      id: this.nextSupplierId++,
      code: `SUP-${String(this.nextSupplierId - 1).padStart(4, '0')}`,
      name,
    };
    this.suppliers.push(supplier);
    return supplier;
  }

  getOrCreateItem(code: number, description: string, supplierName: string, costFobUsd: number): StoredItem {
    const existing = this.items.find(i => i.code === code);
    if (existing) return existing;
    const supplier = this.getOrCreateSupplier(supplierName);
    const item: StoredItem = {
      id: this.nextItemId++,
      code,
      description,
      supplierId: supplier.id,
      costFobUsd,
    };
    this.items.push(item);
    return item;
  }

  addLineItem(consolidationId: number, row: ParsedRow): StoredLineItem {
    const item = this.getOrCreateItem(row.code, row.description, row.supplier, row.costFobUsd);
    const lineItem: StoredLineItem = {
      id: this.nextLineItemId++,
      consolidationId,
      itemId: item.id,
      code: row.code,
      description: row.description,
      supplier: row.supplier,
      stockPhysical: row.stockPhysical,
      stockAvailable: row.stockAvailable,
      monthlyAvg: row.monthlyAvg,
      stockDuration: row.stockDuration,
      suggestedQty: row.suggestedQty,
      decidedQty: null,
      costFobUsd: row.costFobUsd,
      totalFobUsd: row.totalFobUsd,
      totalFobBrl: row.totalFobBrl,
      totalNationalized: row.totalNationalized,
      abcClass: null,
    };
    this.lineItems.push(lineItem);
    return lineItem;
  }
}

export const store = new Store();
