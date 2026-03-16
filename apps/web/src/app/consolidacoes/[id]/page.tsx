'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConsolidation, getDashboardKPIs, getParetoData, getRiskItems, getAuditLog } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import KPICards from '@/components/KPICards';
import LineItemsTable from '@/components/LineItemsTable';
import ParetoChart from '@/components/ParetoChart';
import RiskTable from '@/components/RiskTable';
import AuditLogPanel from '@/components/AuditLogPanel';
import type { Consolidation, DashboardKPIs, ABCItem, RiskItem, AuditLogEntry } from '@/types/api';

type Tab = 'itens' | 'pareto' | 'riscos' | 'auditoria';

function getTabLabel(key: Tab, consolidation: Consolidation | null): string {
  const count = consolidation?.lineItems?.length ?? 0;
  switch (key) {
    case 'itens': return count > 0 ? `Itens (${count})` : 'Itens';
    case 'pareto': return 'Pareto ABC';
    case 'riscos': return 'Riscos';
    case 'auditoria': return 'Auditoria';
  }
}

const TAB_KEYS: Tab[] = ['itens', 'pareto', 'riscos', 'auditoria'];

export default function ConsolidationDetailPage() {
  const params = useParams();
  const id = Number(params.id);

  const [consolidation, setConsolidation] = useState<Consolidation | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [paretoData, setParetoData] = useState<ABCItem[] | null>(null);
  const [riskData, setRiskData] = useState<RiskItem[] | null>(null);
  const [auditData, setAuditData] = useState<AuditLogEntry[] | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('itens');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [c, k] = await Promise.all([
        getConsolidation(id),
        getDashboardKPIs(id),
      ]);
      setConsolidation(c);
      setKpis(k);
    } catch {
      // handled by empty state
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Lazy-load tab data
  useEffect(() => {
    if (activeTab === 'pareto' && !paretoData) {
      getParetoData(id).then(setParetoData).catch(() => {});
    }
    if (activeTab === 'riscos' && !riskData) {
      getRiskItems(id).then(setRiskData).catch(() => {});
    }
    if (activeTab === 'auditoria' && !auditData) {
      getAuditLog(id).then(setAuditData).catch(() => {});
    }
  }, [activeTab, id, paretoData, riskData, auditData]);

  if (loading) return <p className="text-gray-400">Carregando...</p>;
  if (!consolidation) return <p className="text-brand-red">Consolidação não encontrada.</p>;

  const STATUS_LABELS: Record<string, string> = { draft: 'Rascunho', active: 'Ativo', closed: 'Fechado' };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/consolidacoes" className="text-sm text-gray-400 hover:text-gray-200">
            &larr; Consolidações
          </Link>
          <h1 className="text-2xl font-bold mt-1">
            {consolidation.meetingNumber}ª Reunião
            {consolidation.description && <span className="text-gray-400 font-normal"> — {consolidation.description}</span>}
          </h1>
          <div className="flex gap-4 text-sm text-gray-400 mt-1">
            <span>{formatDate(consolidation.meetingDate)}</span>
            <span>Câmbio: {formatNumber(consolidation.exchangeRate, 4)}</span>
            <span className="px-2 py-0.5 rounded text-xs bg-gray-700">
              {STATUS_LABELS[consolidation.status] || consolidation.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/upload/${id}`}
            className="px-4 py-2 bg-brand-green text-gray-950 font-semibold rounded hover:opacity-90 text-sm"
          >
            Upload XLSX
          </Link>
          <Link
            href={`/consolidacoes/${id}/comparar`}
            className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 text-sm"
          >
            Comparar
          </Link>
        </div>
      </div>

      {/* KPIs */}
      {kpis && <KPICards kpis={kpis} />}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800 mb-4">
        {TAB_KEYS.map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-brand-green text-brand-green'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {getTabLabel(key, consolidation)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'itens' && consolidation.lineItems && (
        <LineItemsTable
          lineItems={consolidation.lineItems}
          consolidationId={id}
          onQuantityUpdate={() => {
            loadData();
            setParetoData(null);
            setRiskData(null);
            setAuditData(null);
          }}
        />
      )}
      {activeTab === 'itens' && (!consolidation.lineItems || consolidation.lineItems.length === 0) && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Nenhum item importado ainda.</p>
          <Link
            href={`/upload/${id}`}
            className="px-4 py-2 bg-brand-green text-gray-950 font-semibold rounded hover:opacity-90"
          >
            Importar Planilha
          </Link>
        </div>
      )}

      {activeTab === 'pareto' && (
        paretoData ? <ParetoChart data={paretoData} /> : <p className="text-gray-400">Carregando...</p>
      )}

      {activeTab === 'riscos' && (
        riskData ? <RiskTable items={riskData} /> : <p className="text-gray-400">Carregando...</p>
      )}

      {activeTab === 'auditoria' && (
        auditData ? <AuditLogPanel logs={auditData} /> : <p className="text-gray-400">Carregando...</p>
      )}
    </div>
  );
}
