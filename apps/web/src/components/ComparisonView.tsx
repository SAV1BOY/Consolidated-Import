'use client';

import { formatNumber, formatBRL } from '@/lib/format';
import type { CompareResult, LineItem } from '@/types/api';

function ItemRow({ li, highlight }: { li: LineItem; highlight: string }) {
  return (
    <tr className={`border-b border-gray-800/50 ${highlight}`}>
      <td className="py-2 px-2 font-mono">{li.item.code}</td>
      <td className="py-2 px-2 max-w-[200px] truncate">{li.item.description}</td>
      <td className="py-2 px-2 text-gray-400">{li.item.supplier.name}</td>
      <td className="py-2 px-2 text-right">{formatNumber(li.suggestedQty)}</td>
      <td className="py-2 px-2 text-right">{formatBRL(li.totalNationalized)}</td>
    </tr>
  );
}

function Section({ title, items, highlight, emptyText }: {
  title: string;
  items: LineItem[];
  highlight: string;
  emptyText: string;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-2">
        {title} ({items.length})
      </h3>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyText}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-left text-gray-400">
              <th className="py-2 px-2">Código</th>
              <th className="py-2 px-2">Descrição</th>
              <th className="py-2 px-2">Fornecedor</th>
              <th className="py-2 px-2 text-right">Qtd</th>
              <th className="py-2 px-2 text-right">Nacionalizado</th>
            </tr>
          </thead>
          <tbody>
            {items.map(li => <ItemRow key={li.id} li={li} highlight={highlight} />)}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ComparisonView({ result }: { result: CompareResult }) {
  return (
    <div>
      <Section
        title="Adicionados"
        items={result.added}
        highlight="bg-brand-green/5"
        emptyText="Nenhum item adicionado."
      />
      <Section
        title="Removidos"
        items={result.removed}
        highlight="bg-brand-red/5"
        emptyText="Nenhum item removido."
      />
      <Section
        title="Alterados"
        items={result.changed}
        highlight="bg-brand-yellow/5"
        emptyText="Nenhum item alterado."
      />
    </div>
  );
}
