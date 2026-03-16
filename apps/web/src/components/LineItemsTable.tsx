'use client';

import { useState, useMemo } from 'react';
import { updateLineItemQty } from '@/lib/api';
import { formatNumber, formatUSD, formatBRL } from '@/lib/format';
import type { LineItem } from '@/types/api';

type SortKey = 'code' | 'description' | 'supplier' | 'suggestedQty' | 'decidedQty' | 'stockDuration' | 'totalFobUsd' | 'totalNationalized' | 'abcClass';

interface Props {
  lineItems: LineItem[];
  consolidationId: number;
  onQuantityUpdate: () => void;
}

function getValue(li: LineItem, key: SortKey): string | number {
  switch (key) {
    case 'code': return li.item.code;
    case 'description': return li.item.description;
    case 'supplier': return li.item.supplier.name;
    case 'suggestedQty': return li.suggestedQty;
    case 'decidedQty': return li.decidedQty ?? -1;
    case 'stockDuration': return li.stockDuration;
    case 'totalFobUsd': return li.totalFobUsd;
    case 'totalNationalized': return li.totalNationalized;
    case 'abcClass': return li.abcClass || 'Z';
  }
}

const ABC_COLORS: Record<string, string> = {
  A: 'bg-brand-green/20 text-brand-green',
  B: 'bg-brand-yellow/20 text-brand-yellow',
  C: 'bg-brand-red/20 text-brand-red',
};

export default function LineItemsTable({ lineItems, consolidationId, onQuantityUpdate }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    let items = lineItems;
    if (q) {
      items = items.filter(li =>
        li.item.description.toLowerCase().includes(q) ||
        String(li.item.code).includes(q) ||
        li.item.supplier.name.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [lineItems, filter, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  async function handleSave(itemId: number) {
    const qty = parseFloat(editValue);
    if (isNaN(qty) || qty < 0) return;
    setSaving(true);
    try {
      await updateLineItemQty(consolidationId, itemId, qty);
      setEditingId(null);
      onQuantityUpdate();
    } catch {
      // keep editing on error
    } finally {
      setSaving(false);
    }
  }

  const headers: { key: SortKey; label: string; align?: string }[] = [
    { key: 'code', label: 'Código' },
    { key: 'description', label: 'Descrição' },
    { key: 'supplier', label: 'Fornecedor' },
    { key: 'suggestedQty', label: 'Qtd Sugerida', align: 'text-right' },
    { key: 'decidedQty', label: 'Qtd Decidida', align: 'text-right' },
    { key: 'stockDuration', label: 'Duração Est.', align: 'text-right' },
    { key: 'totalFobUsd', label: 'FOB USD', align: 'text-right' },
    { key: 'totalNationalized', label: 'Nacionalizado', align: 'text-right' },
    { key: 'abcClass', label: 'ABC' },
  ];

  return (
    <div>
      <input
        type="text"
        placeholder="Filtrar por código, descrição ou fornecedor..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="mb-4 w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              {headers.map(h => (
                <th
                  key={h.key}
                  onClick={() => handleSort(h.key)}
                  className={`py-2 px-2 text-left text-gray-400 cursor-pointer hover:text-gray-200 select-none ${h.align || ''}`}
                >
                  {h.label} {sortKey === h.key ? (sortAsc ? '▲' : '▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(li => {
              const isRisk = li.stockDuration < 3 && li.stockDuration > 0;
              return (
                <tr
                  key={li.id}
                  className={`border-b border-gray-800/50 ${isRisk ? 'bg-brand-red/5' : 'hover:bg-gray-900/50'}`}
                >
                  <td className="py-2 px-2 font-mono">{li.item.code}</td>
                  <td className="py-2 px-2 max-w-[200px] truncate">{li.item.description}</td>
                  <td className="py-2 px-2 text-gray-400">{li.item.supplier.name}</td>
                  <td className="py-2 px-2 text-right">{formatNumber(li.suggestedQty)}</td>
                  <td className="py-2 px-2 text-right">
                    {editingId === li.itemId ? (
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSave(li.itemId);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onBlur={() => handleSave(li.itemId)}
                        disabled={saving}
                        className="w-20 bg-gray-700 border border-brand-green rounded px-2 py-0.5 text-right text-sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => {
                          setEditingId(li.itemId);
                          setEditValue(String(li.decidedQty ?? li.suggestedQty));
                        }}
                        className="cursor-pointer hover:text-brand-green"
                        title="Clique para editar"
                      >
                        {li.decidedQty != null ? formatNumber(li.decidedQty) : '—'}
                      </span>
                    )}
                  </td>
                  <td className={`py-2 px-2 text-right ${isRisk ? 'text-brand-red font-medium' : ''}`}>
                    {formatNumber(li.stockDuration, 1)}
                  </td>
                  <td className="py-2 px-2 text-right">{formatUSD(li.totalFobUsd)}</td>
                  <td className="py-2 px-2 text-right">{formatBRL(li.totalNationalized)}</td>
                  <td className="py-2 px-2">
                    {li.abcClass && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${ABC_COLORS[li.abcClass] || ''}`}>
                        {li.abcClass}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center text-gray-500 py-8">Nenhum item encontrado.</p>
        )}
      </div>
    </div>
  );
}
