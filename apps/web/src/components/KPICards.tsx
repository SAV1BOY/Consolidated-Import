'use client';

import { formatBRL, formatUSD, formatNumber } from '@/lib/format';
import type { DashboardKPIs } from '@/types/api';

const CARDS: { key: keyof DashboardKPIs; label: string; format: (v: number) => string; color: string }[] = [
  { key: 'totalItems', label: 'Total Itens', format: v => formatNumber(v), color: 'border-brand-blue' },
  { key: 'itemsWithPurchase', label: 'Itens c/ Compra', format: v => formatNumber(v), color: 'border-brand-green' },
  { key: 'totalFobUsd', label: 'Total FOB USD', format: v => formatUSD(v), color: 'border-brand-purple' },
  { key: 'totalFobBrl', label: 'Total FOB BRL', format: v => formatBRL(v), color: 'border-brand-blue' },
  { key: 'totalNationalized', label: 'Total Nacionalizado', format: v => formatBRL(v), color: 'border-brand-yellow' },
  { key: 'exchangeRate', label: 'Câmbio', format: v => formatNumber(v, 4), color: 'border-brand-green' },
  { key: 'activeSuppliers', label: 'Fornecedores Ativos', format: v => `${formatNumber(v)} / `, color: 'border-brand-red' },
  { key: 'avgCostPerUnit', label: 'Custo Médio/Un', format: v => formatBRL(v), color: 'border-brand-purple' },
];

export default function KPICards({ kpis }: { kpis: DashboardKPIs }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {CARDS.map(card => (
        <div
          key={card.key}
          className={`bg-gray-900 rounded-lg border-l-4 ${card.color} p-4`}
        >
          <p className="text-xs text-gray-400 mb-1">{card.label}</p>
          <p className="text-lg font-bold">
            {card.key === 'activeSuppliers'
              ? `${formatNumber(kpis.activeSuppliers)} / ${formatNumber(kpis.totalSuppliers)}`
              : card.format(kpis[card.key])}
          </p>
        </div>
      ))}
    </div>
  );
}
