import { prisma } from '../db.js';

export async function logAction(
  consolidationId: number | null,
  action: string,
  entityType: string,
  entityId: number,
  oldValue?: unknown,
  newValue?: unknown,
) {
  return prisma.auditLog.create({
    data: {
      consolidationId,
      action,
      entityType,
      entityId,
      oldValue: oldValue !== undefined ? (oldValue as any) : undefined,
      newValue: newValue !== undefined ? (newValue as any) : undefined,
    },
  });
}

export async function getAuditLog(consolidationId?: number) {
  return prisma.auditLog.findMany({
    where: consolidationId !== undefined ? { consolidationId } : {},
    orderBy: { createdAt: 'desc' },
  });
}

export async function clearAuditLog() {
  await prisma.auditLog.deleteMany({});
}
