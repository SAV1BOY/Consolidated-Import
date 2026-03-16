'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConsolidations, compareConsolidations } from '@/lib/api';
import ComparisonView from '@/components/ComparisonView';
import type { Consolidation, CompareResult } from '@/types/api';

export default function CompararPage() {
  const params = useParams();
  const id = Number(params.id);

  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
  const [otherId, setOtherId] = useState<number | null>(null);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getConsolidations().then(setConsolidations).catch(() => {});
  }, []);

  useEffect(() => {
    if (!otherId) return;
    setLoading(true);
    compareConsolidations(id, otherId)
      .then(setResult)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id, otherId]);

  const others = consolidations.filter(c => c.id !== id);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/consolidacoes/${id}`} className="text-sm text-gray-400 hover:text-gray-200">
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-bold">Comparar Consolidações</h1>
      </div>

      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Comparar com:</label>
        <select
          value={otherId ?? ''}
          onChange={e => setOtherId(e.target.value ? Number(e.target.value) : null)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm w-64"
        >
          <option value="">— Selecionar consolidação —</option>
          {others.map(c => (
            <option key={c.id} value={c.id}>
              {c.meetingNumber}ª Reunião{c.description ? ` — ${c.description}` : ''}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-400">Comparando...</p>}
      {result && <ComparisonView result={result} />}
    </div>
  );
}
