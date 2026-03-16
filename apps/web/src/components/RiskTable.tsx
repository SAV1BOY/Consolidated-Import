'use client';

import { formatNumber } from '@/lib/format';
import type { RiskItem } from '@/types/api';

export default function RiskTable({ items }: { items: RiskItem[] }) {
  if (items.length === 0) {
    return <p className="text-gray-500 text-center py-8">Nenhum item com estoque em risco (&lt; 3 meses).</p>;
  }

  return (
    <div>
      <p className="text-sm text-gray-400 mb-4">
        {items.length} {items.length === 1 ? 'item' : 'itens'} com cobertura de estoque inferior a 3 meses.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="py-2 px-2">Código</th>
              <th className="py-2 px-2">Descrição</th>
              <th className="py-2 px-2">Fornecedor</th>
              <th className="py-2 px-2 text-right">Estoque Disp.</th>
              <th className="py-2 px-2 text-right">Média Mensal</th>
              <th className="py-2 px-2 text-right">Duração (meses)</th>
              <th className="py-2 px-2 text-right">Qtd Sugerida</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.itemId} className="border-b border-gray-800/50 bg-brand-red/5">
                <td className="py-2 px-2 font-mono">{item.code}</td>
                <td className="py-2 px-2 max-w-[200px] truncate">{item.description}</td>
                <td className="py-2 px-2 text-gray-400">{item.supplier}</td>
                <td className="py-2 px-2 text-right">{formatNumber(item.stockAvailable)}</td>
                <td className="py-2 px-2 text-right">{formatNumber(item.monthlyAvg)}</td>
                <td className="py-2 px-2 text-right text-brand-red font-medium">
                  {formatNumber(item.stockDuration, 1)}
                </td>
                <td className="py-2 px-2 text-right">{formatNumber(item.suggestedQty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
