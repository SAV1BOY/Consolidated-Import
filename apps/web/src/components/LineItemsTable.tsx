'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { updateLineItemQty } from '@/lib/api';
import { formatNumber, formatUSD, formatBRL } from '@/lib/format';
import type { LineItem } from '@/types/api';

// ── Types ──

type SortKey =
  | 'code' | 'description' | 'supplier'
  | 'stockPhysical' | 'stockAvailable' | 'monthlyAvg' | 'stockDuration'
  | 'suggestedQty' | 'decidedQty'
  | 'costFobUsd' | 'totalFobUsd' | 'totalFobBrl' | 'totalNationalized'
  | 'abcClass';

type FilterABC = 'all' | 'A' | 'B' | 'C';

interface Props {
  lineItems: LineItem[];
  consolidationId: number;
  onQuantityUpdate: () => void;
}

// ── Helpers ──

function getValue(li: LineItem, key: SortKey): string | number {
  switch (key) {
    case 'code': return li.item.code;
    case 'description': return li.item.description;
    case 'supplier': return li.item.supplier.name;
    case 'stockPhysical': return li.stockPhysical;
    case 'stockAvailable': return li.stockAvailable;
    case 'monthlyAvg': return li.monthlyAvg;
    case 'stockDuration': return li.stockDuration;
    case 'suggestedQty': return li.suggestedQty;
    case 'decidedQty': return li.decidedQty ?? -1;
    case 'costFobUsd': return li.item.costFobUsd;
    case 'totalFobUsd': return li.totalFobUsd;
    case 'totalFobBrl': return li.totalFobBrl;
    case 'totalNationalized': return li.totalNationalized;
    case 'abcClass': return li.abcClass || 'Z';
  }
}

const ABC_COLORS: Record<string, string> = {
  A: 'bg-brand-green/20 text-brand-green',
  B: 'bg-brand-yellow/20 text-brand-yellow',
  C: 'bg-brand-red/20 text-brand-red',
};

const ABC_BORDER: Record<string, string> = {
  A: 'border-l-brand-green',
  B: 'border-l-brand-yellow',
  C: 'border-l-brand-red',
};

// ── Column definitions ──

interface ColumnDef {
  key: SortKey;
  label: string;
  shortLabel?: string;
  align?: 'right';
  width?: string;
  group: 'info' | 'stock' | 'qty' | 'value' | 'class';
}

const COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Código', width: 'w-20', group: 'info' },
  { key: 'description', label: 'Descrição', width: 'min-w-[180px] max-w-[260px]', group: 'info' },
  { key: 'supplier', label: 'Fornecedor', width: 'min-w-[100px] max-w-[160px]', group: 'info' },
  { key: 'stockPhysical', label: 'Est. Físico', shortLabel: 'Físico', align: 'right', width: 'w-24', group: 'stock' },
  { key: 'stockAvailable', label: 'Est. Disponível', shortLabel: 'Dispon.', align: 'right', width: 'w-24', group: 'stock' },
  { key: 'monthlyAvg', label: 'Média Mensal', shortLabel: 'Méd/Mês', align: 'right', width: 'w-24', group: 'stock' },
  { key: 'stockDuration', label: 'Duração (meses)', shortLabel: 'Duração', align: 'right', width: 'w-24', group: 'stock' },
  { key: 'suggestedQty', label: 'Qtd Sugerida', shortLabel: 'Sugerida', align: 'right', width: 'w-24', group: 'qty' },
  { key: 'decidedQty', label: 'Qtd Decidida', shortLabel: 'Decidida', align: 'right', width: 'w-28', group: 'qty' },
  { key: 'costFobUsd', label: 'Custo Un. FOB', shortLabel: 'Un.FOB', align: 'right', width: 'w-28', group: 'value' },
  { key: 'totalFobUsd', label: 'Total FOB USD', shortLabel: 'FOB USD', align: 'right', width: 'w-28', group: 'value' },
  { key: 'totalNationalized', label: 'Nacionalizado', align: 'right', width: 'w-32', group: 'value' },
  { key: 'abcClass', label: 'ABC', width: 'w-14', group: 'class' },
];

const VISIBLE_COLUMNS_DEFAULT = new Set<SortKey>([
  'code', 'description', 'supplier', 'stockDuration',
  'suggestedQty', 'decidedQty', 'totalFobUsd', 'totalNationalized', 'abcClass',
]);

// ── Inline Edit Cell ──

function EditableCell({
  lineItem,
  consolidationId,
  onSaved,
}: {
  lineItem: LineItem;
  consolidationId: number;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    setValue(String(lineItem.decidedQty ?? lineItem.suggestedQty));
    setEditing(true);
    setError(false);
  }, [lineItem.decidedQty, lineItem.suggestedQty]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setError(false);
  }, []);

  const saveEdit = useCallback(async () => {
    const qty = parseFloat(value);
    if (isNaN(qty) || qty < 0) {
      setError(true);
      return;
    }

    // Skip save if value unchanged
    if (lineItem.decidedQty !== null && qty === lineItem.decidedQty) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(false);
    try {
      await updateLineItemQty(consolidationId, lineItem.itemId, qty);
      setEditing(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
      onSaved();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }, [consolidationId, lineItem.itemId, lineItem.decidedQty, value, onSaved]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    }
    if (e.key === 'Escape') {
      cancelEdit();
    }
    // Tab navigation: save and let browser move focus
    if (e.key === 'Tab') {
      saveEdit();
    }
  }, [saveEdit, cancelEdit]);

  if (editing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={e => { setValue(e.target.value); setError(false); }}
          onKeyDown={handleKeyDown}
          onBlur={saveEdit}
          disabled={saving}
          className={`w-24 bg-gray-800 border-2 rounded px-2 py-1 text-right text-sm font-medium outline-none transition-colors ${
            error
              ? 'border-brand-red text-brand-red'
              : saving
              ? 'border-brand-yellow/50 text-gray-400'
              : 'border-brand-green focus:border-brand-green text-white'
          }`}
        />
        {saving && (
          <span className="absolute right-1 top-1/2 -translate-y-1/2">
            <span className="w-3 h-3 border-2 border-gray-500 border-t-brand-green rounded-full animate-spin inline-block" />
          </span>
        )}
      </div>
    );
  }

  const hasDecided = lineItem.decidedQty != null;
  const displayValue = hasDecided ? formatNumber(lineItem.decidedQty!) : '—';
  const isDifferent = hasDecided && lineItem.decidedQty !== lineItem.suggestedQty;

  return (
    <button
      onClick={startEdit}
      onDoubleClick={startEdit}
      className={`group inline-flex items-center gap-1.5 px-2 py-1 rounded transition-all text-right w-full justify-end ${
        justSaved
          ? 'bg-brand-green/10 text-brand-green'
          : 'hover:bg-gray-800 cursor-pointer'
      }`}
      title="Clique para editar a quantidade decidida"
    >
      <span className={`font-medium ${
        !hasDecided ? 'text-gray-500 italic' :
        isDifferent ? 'text-brand-green' : ''
      }`}>
        {displayValue}
      </span>
      {isDifferent && (
        <span className="text-[10px] text-gray-500">
          ({lineItem.decidedQty! > lineItem.suggestedQty ? '+' : ''}
          {formatNumber(lineItem.decidedQty! - lineItem.suggestedQty)})
        </span>
      )}
      <span className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">
        ✎
      </span>
    </button>
  );
}

// ── Summary Bar ──

function SummaryBar({ items }: { items: LineItem[] }) {
  const stats = useMemo(() => {
    const total = items.length;
    const decided = items.filter(li => li.decidedQty != null).length;
    const totalQty = items.reduce((sum, li) => sum + (li.decidedQty ?? li.suggestedQty), 0);
    const totalFob = items.reduce((sum, li) => sum + li.totalFobUsd, 0);
    const totalNac = items.reduce((sum, li) => sum + li.totalNationalized, 0);
    const risk = items.filter(li => li.stockDuration > 0 && li.stockDuration < 3).length;
    return { total, decided, totalQty, totalFob, totalNac, risk };
  }, [items]);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-3 py-2 bg-gray-900/50 rounded-lg border border-gray-800 text-xs text-gray-400">
      <span>{stats.total} itens</span>
      <span className="text-gray-600">|</span>
      <span>
        <span className={stats.decided === stats.total ? 'text-brand-green' : 'text-brand-yellow'}>
          {stats.decided}/{stats.total}
        </span> decididos
      </span>
      <span className="text-gray-600">|</span>
      <span>Qtd: <span className="text-gray-200">{formatNumber(stats.totalQty)}</span></span>
      <span className="text-gray-600">|</span>
      <span>FOB: <span className="text-gray-200">{formatUSD(stats.totalFob)}</span></span>
      <span className="text-gray-600">|</span>
      <span>Nac: <span className="text-gray-200">{formatBRL(stats.totalNac)}</span></span>
      {stats.risk > 0 && (
        <>
          <span className="text-gray-600">|</span>
          <span className="text-brand-red">{stats.risk} em risco</span>
        </>
      )}
    </div>
  );
}

// ── Column Visibility Toggle ──

function ColumnToggle({
  visibleColumns,
  onToggle,
}: {
  visibleColumns: Set<SortKey>;
  onToggle: (key: SortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const groups: { label: string; group: string }[] = [
    { label: 'Informações', group: 'info' },
    { label: 'Estoque', group: 'stock' },
    { label: 'Quantidades', group: 'qty' },
    { label: 'Valores', group: 'value' },
    { label: 'Classificação', group: 'class' },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1.5 text-xs border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-400"
      >
        Colunas ({visibleColumns.size})
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 p-3 w-56">
          {groups.map(g => {
            const cols = COLUMNS.filter(c => c.group === g.group);
            return (
              <div key={g.group} className="mb-2 last:mb-0">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{g.label}</p>
                {cols.map(c => (
                  <label key={c.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(c.key)}
                      onChange={() => onToggle(c.key)}
                      className="rounded border-gray-600 bg-gray-800 text-brand-green focus:ring-brand-green/30 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-gray-300">{c.shortLabel || c.label}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──

export default function LineItemsTable({ lineItems, consolidationId, onQuantityUpdate }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('code');
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState('');
  const [filterABC, setFilterABC] = useState<FilterABC>('all');
  const [showRiskOnly, setShowRiskOnly] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<SortKey>>(
    () => new Set(VISIBLE_COLUMNS_DEFAULT),
  );

  const toggleColumn = useCallback((key: SortKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 3) next.delete(key); // minimum 3 columns
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // ── Filtering & sorting ──
  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    let items = lineItems;

    // Text filter
    if (q) {
      items = items.filter(li =>
        li.item.description.toLowerCase().includes(q) ||
        String(li.item.code).includes(q) ||
        li.item.supplier.name.toLowerCase().includes(q)
      );
    }

    // ABC filter
    if (filterABC !== 'all') {
      items = items.filter(li => li.abcClass === filterABC);
    }

    // Risk filter
    if (showRiskOnly) {
      items = items.filter(li => li.stockDuration > 0 && li.stockDuration < 3);
    }

    // Sort
    return [...items].sort((a, b) => {
      const va = getValue(a, sortKey);
      const vb = getValue(b, sortKey);
      const cmp = va < vb ? -1 : va > vb ? 1 : 0;
      return sortAsc ? cmp : -cmp;
    });
  }, [lineItems, filter, filterABC, showRiskOnly, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(key === 'code' || key === 'description' || key === 'supplier');
    }
  }

  // ABC counts
  const abcCounts = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0 };
    for (const li of lineItems) {
      if (li.abcClass === 'A') counts.A++;
      else if (li.abcClass === 'B') counts.B++;
      else if (li.abcClass === 'C') counts.C++;
    }
    return counts;
  }, [lineItems]);

  const activeColumns = COLUMNS.filter(c => visibleColumns.has(c.key));

  // ── Render cell content ──
  function renderCell(li: LineItem, col: ColumnDef) {
    const isRisk = li.stockDuration > 0 && li.stockDuration < 3;

    switch (col.key) {
      case 'code':
        return <span className="font-mono text-gray-200">{li.item.code}</span>;
      case 'description':
        return <span className="truncate block" title={li.item.description}>{li.item.description}</span>;
      case 'supplier':
        return <span className="text-gray-400 truncate block">{li.item.supplier.name}</span>;
      case 'stockPhysical':
        return formatNumber(li.stockPhysical);
      case 'stockAvailable':
        return formatNumber(li.stockAvailable);
      case 'monthlyAvg':
        return formatNumber(li.monthlyAvg);
      case 'stockDuration':
        return (
          <span className={isRisk ? 'text-brand-red font-semibold' : ''}>
            {formatNumber(li.stockDuration, 1)}
            {isRisk && <span className="ml-1 text-[10px]">!</span>}
          </span>
        );
      case 'suggestedQty':
        return formatNumber(li.suggestedQty);
      case 'decidedQty':
        return (
          <EditableCell
            lineItem={li}
            consolidationId={consolidationId}
            onSaved={onQuantityUpdate}
          />
        );
      case 'costFobUsd':
        return formatUSD(li.item.costFobUsd);
      case 'totalFobUsd':
        return formatUSD(li.totalFobUsd);
      case 'totalFobBrl':
        return formatBRL(li.totalFobBrl);
      case 'totalNationalized':
        return formatBRL(li.totalNationalized);
      case 'abcClass':
        return li.abcClass ? (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${ABC_COLORS[li.abcClass] || ''}`}>
            {li.abcClass}
          </span>
        ) : null;
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar código, descrição ou fornecedor..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-gray-600 focus:outline-none transition-colors"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          )}
        </div>

        {/* ABC filter pills */}
        <div className="flex gap-1">
          <button
            onClick={() => setFilterABC('all')}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
              filterABC === 'all'
                ? 'bg-gray-700 border-gray-600 text-white'
                : 'border-gray-700 text-gray-500 hover:text-gray-300'
            }`}
          >
            Todos
          </button>
          {(['A', 'B', 'C'] as const).map(cls => (
            <button
              key={cls}
              onClick={() => setFilterABC(filterABC === cls ? 'all' : cls)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                filterABC === cls
                  ? `${ABC_COLORS[cls]} border-transparent`
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {cls} ({abcCounts[cls]})
            </button>
          ))}
        </div>

        {/* Risk toggle */}
        <button
          onClick={() => setShowRiskOnly(!showRiskOnly)}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
            showRiskOnly
              ? 'bg-brand-red/20 text-brand-red border-brand-red/30'
              : 'border-gray-700 text-gray-500 hover:text-gray-300'
          }`}
        >
          Risco
        </button>

        {/* Column toggle */}
        <ColumnToggle visibleColumns={visibleColumns} onToggle={toggleColumn} />
      </div>

      {/* ── Summary ── */}
      <SummaryBar items={filtered} />

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900/80">
              {activeColumns.map(col => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`py-2.5 px-3 text-left text-gray-400 cursor-pointer hover:text-gray-200 select-none text-xs font-medium uppercase tracking-wider ${
                    col.align === 'right' ? 'text-right' : ''
                  } ${col.width || ''} ${
                    sortKey === col.key ? 'text-gray-200' : ''
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.shortLabel || col.label}
                    {sortKey === col.key && (
                      <span className="text-brand-green text-[10px]">{sortAsc ? '▲' : '▼'}</span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/50">
            {filtered.map(li => {
              const isRisk = li.stockDuration > 0 && li.stockDuration < 3;
              const abcBorder = li.abcClass ? ABC_BORDER[li.abcClass] : '';

              return (
                <tr
                  key={li.id}
                  className={`transition-colors ${
                    isRisk
                      ? 'bg-brand-red/[0.03] hover:bg-brand-red/[0.06]'
                      : 'hover:bg-gray-900/50'
                  } ${abcBorder ? `border-l-2 ${abcBorder}` : ''}`}
                >
                  {activeColumns.map(col => (
                    <td
                      key={col.key}
                      className={`py-2 px-3 ${
                        col.align === 'right' ? 'text-right' : ''
                      } ${col.width || ''}`}
                    >
                      {renderCell(li, col)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-1">Nenhum item encontrado.</p>
            {(filter || filterABC !== 'all' || showRiskOnly) && (
              <button
                onClick={() => { setFilter(''); setFilterABC('all'); setShowRiskOnly(false); }}
                className="text-xs text-brand-green hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Keyboard hint ── */}
      <p className="text-[11px] text-gray-600 text-right">
        Clique na Qtd Decidida para editar · Enter salva · Esc cancela · Tab avança
      </p>
    </div>
  );
}
