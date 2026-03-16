'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConsolidations, createConsolidation } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import type { Consolidation } from '@/types/api';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  closed: 'Fechado',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-600',
  active: 'bg-brand-green',
  closed: 'bg-brand-blue',
};

export default function ConsolidacoesPage() {
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    meetingNumber: 1,
    meetingDate: '',
    exchangeRate: 5.3232,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    try {
      const data = await getConsolidations();
      setConsolidations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await createConsolidation({
        meetingNumber: formData.meetingNumber,
        meetingDate: formData.meetingDate,
        exchangeRate: formData.exchangeRate,
        description: formData.description || undefined,
      });
      setShowForm(false);
      setFormData({ meetingNumber: 1, meetingDate: '', exchangeRate: 5.3232, description: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-400">Carregando...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Consolidações</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-brand-green text-gray-950 font-semibold rounded hover:opacity-90"
        >
          {showForm ? 'Cancelar' : 'Nova Consolidação'}
        </button>
      </div>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800 grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm text-gray-400">Nº Reunião</span>
            <input
              type="number"
              min={1}
              max={26}
              value={formData.meetingNumber}
              onChange={e => setFormData(f => ({ ...f, meetingNumber: parseInt(e.target.value) || 1 }))}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Data da Reunião</span>
            <input
              type="date"
              value={formData.meetingDate}
              onChange={e => setFormData(f => ({ ...f, meetingDate: e.target.value }))}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Câmbio (USD → BRL)</span>
            <input
              type="number"
              step="0.0001"
              value={formData.exchangeRate}
              onChange={e => setFormData(f => ({ ...f, exchangeRate: parseFloat(e.target.value) || 0 }))}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">Descrição (opcional)</span>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
            />
          </label>
          <div className="col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-brand-green text-gray-950 font-semibold rounded hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Criando...' : 'Criar Consolidação'}
            </button>
          </div>
        </form>
      )}

      {consolidations.length === 0 ? (
        <p className="text-gray-500">Nenhuma consolidação encontrada. Crie a primeira.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left text-gray-400">
                <th className="py-3 px-2">Reunião</th>
                <th className="py-3 px-2">Data</th>
                <th className="py-3 px-2">Descrição</th>
                <th className="py-3 px-2">Câmbio</th>
                <th className="py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {consolidations.map(c => (
                <tr key={c.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                  <td className="py-3 px-2">
                    <Link href={`/consolidacoes/${c.id}`} className="text-brand-green hover:underline">
                      {c.meetingNumber}ª de {c.totalMeetings}
                    </Link>
                  </td>
                  <td className="py-3 px-2">{formatDate(c.meetingDate)}</td>
                  <td className="py-3 px-2 text-gray-400">{c.description || '—'}</td>
                  <td className="py-3 px-2">{formatNumber(c.exchangeRate, 4)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-600'}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
