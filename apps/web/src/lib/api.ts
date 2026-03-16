import type {
  Consolidation,
  DashboardKPIs,
  ABCItem,
  RiskItem,
  SpreadsheetPreview,
  MergeReport,
  CompareResult,
  AuditLogEntry,
  LineItem,
  ColumnMappingConfig,
} from '@/types/api';

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// Consolidations
export function getConsolidations(): Promise<Consolidation[]> {
  return fetchJSON('/api/consolidations');
}

export function getConsolidation(id: number): Promise<Consolidation> {
  return fetchJSON(`/api/consolidations/${id}`);
}

export function createConsolidation(data: {
  meetingNumber: number;
  meetingDate: string;
  exchangeRate: number;
  description?: string;
}): Promise<Consolidation> {
  return fetchJSON('/api/consolidations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateConsolidation(
  id: number,
  data: { status?: string; description?: string },
): Promise<Consolidation> {
  return fetchJSON(`/api/consolidations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateLineItemQty(
  consolidationId: number,
  itemId: number,
  decidedQty: number,
): Promise<LineItem> {
  return fetchJSON(`/api/consolidations/${consolidationId}/items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decidedQty }),
  });
}

// Dashboard
export function getDashboardKPIs(consolidationId: number): Promise<DashboardKPIs> {
  return fetchJSON(`/api/dashboard/${consolidationId}`);
}

export function getParetoData(consolidationId: number): Promise<ABCItem[]> {
  return fetchJSON(`/api/dashboard/${consolidationId}/pareto`);
}

export function getRiskItems(consolidationId: number): Promise<RiskItem[]> {
  return fetchJSON(`/api/dashboard/${consolidationId}/risk`);
}

// Upload
export async function uploadPreview(file: File): Promise<SpreadsheetPreview> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/preview', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Upload failed: ${res.status}`);
  }
  return res.json();
}

export async function importSpreadsheet(
  consolidationId: number,
  file: File,
  mapping: ColumnMappingConfig,
): Promise<{ report: MergeReport }> {
  const form = new FormData();
  form.append('file', file);
  form.append('mapping', JSON.stringify(mapping));
  const res = await fetch(`/api/upload/consolidations/${consolidationId}/import`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Import failed: ${res.status}`);
  }
  return res.json();
}

// Export
async function downloadBlob(url: string, filename: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function downloadExcel(consolidationId: number): Promise<void> {
  return downloadBlob(
    `/api/consolidations/${consolidationId}/export/excel`,
    `consolidacao-${consolidationId}.xlsx`,
  );
}

export function downloadPDF(consolidationId: number): Promise<void> {
  return downloadBlob(
    `/api/consolidations/${consolidationId}/export/pdf`,
    `consolidacao-${consolidationId}.pdf`,
  );
}

// Compare
export function compareConsolidations(id: number, otherId: number): Promise<CompareResult> {
  return fetchJSON(`/api/consolidations/${id}/compare/${otherId}`);
}

// Audit
export function getAuditLog(consolidationId?: number): Promise<AuditLogEntry[]> {
  const qs = consolidationId ? `?consolidationId=${consolidationId}` : '';
  return fetchJSON(`/api/audit-log${qs}`);
}
