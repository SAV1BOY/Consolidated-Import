'use client';

import { useState } from 'react';
import { uploadPreview, importSpreadsheet } from '@/lib/api';
import type { SpreadsheetPreview, MergeReport, ColumnMappingConfig } from '@/types/api';

const REQUIRED_FIELDS: { key: keyof ColumnMappingConfig; label: string }[] = [
  { key: 'code', label: 'Código' },
  { key: 'description', label: 'Descrição' },
  { key: 'supplier', label: 'Fornecedor' },
  { key: 'costFobUsd', label: 'Custo FOB USD' },
  { key: 'suggestedQty', label: 'Qtd Sugerida' },
];

const OPTIONAL_FIELDS: { key: keyof ColumnMappingConfig; label: string }[] = [
  { key: 'stockPhysical', label: 'Estoque Físico' },
  { key: 'stockAvailable', label: 'Estoque Disponível' },
  { key: 'monthlyAvg', label: 'Média Mensal' },
  { key: 'stockDuration', label: 'Duração Estoque' },
  { key: 'totalFobUsd', label: 'Total FOB USD' },
  { key: 'totalFobBrl', label: 'Total FOB BRL' },
  { key: 'totalNationalized', label: 'Total Nacionalizado' },
];

type Step = 'upload' | 'mapping' | 'result';

export default function UploadWizard({ consolidationId }: { consolidationId: number }) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SpreadsheetPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<MergeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setLoading(true);
    setError('');
    try {
      const data = await uploadPreview(selectedFile);
      setPreview(data);
      setMapping(data.suggestedMapping || {});
      setStep('mapping');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setLoading(false);
    }
  }

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const result = await importSpreadsheet(consolidationId, file, mapping as unknown as ColumnMappingConfig);
      setReport(result.report);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }

  // Column letter options from headers
  const columnOptions = preview?.headers.map((h, i) => {
    const letter = String.fromCharCode(65 + i);
    return { value: letter, label: `${letter} — ${h}` };
  }) || [];

  return (
    <div>
      {error && <p className="text-brand-red mb-4">{error}</p>}

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">Selecione um arquivo .xlsx para importar</p>
          <label className="inline-block px-6 py-3 bg-brand-green text-gray-950 font-semibold rounded cursor-pointer hover:opacity-90">
            {loading ? 'Processando...' : 'Escolher Arquivo'}
            <input
              type="file"
              accept=".xlsx"
              className="hidden"
              disabled={loading}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </label>
        </div>
      )}

      {/* Step 2: Column Mapping */}
      {step === 'mapping' && preview && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Mapeamento de Colunas</h3>
          <p className="text-sm text-gray-400 mb-4">
            {preview.totalRows} linhas encontradas. Ajuste o mapeamento se necessário.
          </p>

          {/* Preview table */}
          <div className="overflow-x-auto mb-6">
            <table className="text-xs border border-gray-800">
              <thead>
                <tr className="bg-gray-900">
                  {preview.headers.map((h, i) => (
                    <th key={i} className="px-2 py-1 border border-gray-800 text-gray-400">
                      {String.fromCharCode(65 + i)}: {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.slice(0, 3).map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-2 py-1 border border-gray-800 text-gray-300 truncate max-w-[150px]">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mapping selects */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Campos Obrigatórios</h4>
              {REQUIRED_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400 w-32">{f.label}</span>
                  <select
                    value={mapping[f.key] || ''}
                    onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                  >
                    <option value="">— Selecionar —</option>
                    {columnOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Campos Opcionais</h4>
              {OPTIONAL_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-400 w-32">{f.label}</span>
                  <select
                    value={mapping[f.key] || ''}
                    onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                  >
                    <option value="">— Não mapear —</option>
                    {columnOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setPreview(null); setFile(null); }}
              className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800"
            >
              Voltar
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !REQUIRED_FIELDS.every(f => mapping[f.key])}
              className="px-4 py-2 bg-brand-green text-gray-950 font-semibold rounded hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === 'result' && report && (
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-brand-green mb-4">Importação Concluída</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Itens de linha criados:</span>
              <span className="font-medium">{report.lineItemsCreated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Novos itens:</span>
              <span className="font-medium">{report.newItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Itens atualizados:</span>
              <span className="font-medium">{report.updatedItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Novos fornecedores:</span>
              <span className="font-medium">{report.newSuppliers}</span>
            </div>
          </div>
          {report.errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-brand-red mb-2">Erros ({report.errors.length})</h4>
              <ul className="text-xs text-gray-400 space-y-1">
                {report.errors.map((e, i) => (
                  <li key={i}>Linha {e.row}: {e.field} — {e.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
