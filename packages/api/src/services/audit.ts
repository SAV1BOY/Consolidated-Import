export interface AuditEntry {
  id: number;
  consolidationId: number | null;
  action: string;
  entityType: string;
  entityId: number;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
}

// In-memory audit log for testing; will be replaced with Prisma in production
const auditLog: AuditEntry[] = [];
let nextId = 1;

export function logAction(
  consolidationId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  oldValue?: unknown,
  newValue?: unknown,
): AuditEntry {
  const entry: AuditEntry = {
    id: nextId++,
    consolidationId,
    action,
    entityType,
    entityId,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
    createdAt: new Date(),
  };
  auditLog.push(entry);
  return entry;
}

export function getAuditLog(consolidationId?: number): AuditEntry[] {
  if (consolidationId !== undefined) {
    return auditLog.filter(e => e.consolidationId === consolidationId);
  }
  return [...auditLog];
}

export function clearAuditLog(): void {
  auditLog.length = 0;
  nextId = 1;
}
