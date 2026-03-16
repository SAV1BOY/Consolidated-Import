'use client';

import { formatDate } from '@/lib/format';
import type { AuditLogEntry } from '@/types/api';

const ACTION_LABELS: Record<string, string> = {
  spreadsheet_uploaded: 'Planilha importada',
  qty_changed: 'Quantidade alterada',
  status_changed: 'Status alterado',
  consolidation_created: 'Consolidação criada',
};

export default function AuditLogPanel({ logs }: { logs: AuditLogEntry[] }) {
  if (logs.length === 0) {
    return <p className="text-gray-500 text-center py-8">Nenhum registro de auditoria.</p>;
  }

  return (
    <div className="space-y-2">
      {logs.map(log => (
        <div key={log.id} className="bg-gray-900 rounded border border-gray-800 p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">
              {ACTION_LABELS[log.action] || log.action}
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(log.createdAt)}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            <span>{log.entityType} #{log.entityId}</span>
            {log.oldValue != null && (
              <span className="ml-3">
                Anterior: <code className="text-brand-red">{JSON.stringify(log.oldValue)}</code>
              </span>
            )}
            {log.newValue != null && (
              <span className="ml-3">
                Novo: <code className="text-brand-green">{JSON.stringify(log.newValue)}</code>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
