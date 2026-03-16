'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadPreview, importSpreadsheet } from '@/lib/api';
import type { SpreadsheetPreview, MergeReport, ColumnMappingConfig } from '@/types/api';

// ── Field definitions ──

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

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

type Step = 'upload' | 'mapping' | 'confirm' | 'result';

const STEPS: { key: Step; label: string; number: number }[] = [
  { key: 'upload', label: 'Arquivo', number: 1 },
  { key: 'mapping', label: 'Mapeamento', number: 2 },
  { key: 'confirm', label: 'Confirmação', number: 3 },
  { key: 'result', label: 'Resultado', number: 4 },
];

// ── Helper: column letter from index ──

function colLetter(i: number): string {
  return String.fromCharCode(65 + i);
}

// ── Helper: get column index from letter ──

function colIndex(letter: string): number {
  return letter.charCodeAt(0) - 65;
}

// ── Stepper component ──

function Stepper({ currentStep }: { currentStep: Step }) {
  const currentIdx = STEPS.findIndex(s => s.key === currentStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((s, i) => {
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors ${
              isDone ? 'bg-brand-green text-gray-950' :
              isCurrent ? 'bg-brand-green/20 text-brand-green border-2 border-brand-green' :
              'bg-gray-800 text-gray-500 border border-gray-700'
            }`}>
              {isDone ? '✓' : s.number}
            </div>
            <span className={`text-sm ${isCurrent ? 'text-white font-medium' : 'text-gray-500'}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`w-12 h-px ${i < currentIdx ? 'bg-brand-green' : 'bg-gray-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ──

export default function UploadWizard({ consolidationId }: { consolidationId: number }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SpreadsheetPreview | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [report, setReport] = useState<MergeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // ── Duplicate detection ──
  const duplicateColumns = useMemo(() => {
    const counts: Record<string, string[]> = {};
    for (const [field, col] of Object.entries(mapping)) {
      if (!col) continue;
      if (!counts[col]) counts[col] = [];
      counts[col].push(field);
    }
    const dupes: Set<string> = new Set();
    for (const [col, fields] of Object.entries(counts)) {
      if (fields.length > 1) dupes.add(col);
    }
    return dupes;
  }, [mapping]);

  // ── Mapped columns set (for highlighting preview) ──
  const mappedColumnIndices = useMemo(() => {
    const indices = new Set<number>();
    for (const col of Object.values(mapping)) {
      if (col) indices.add(colIndex(col));
    }
    return indices;
  }, [mapping]);

  // ── Reverse mapping (column letter → field label) ──
  const columnFieldLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const [field, col] of Object.entries(mapping)) {
      if (!col) continue;
      const fieldDef = ALL_FIELDS.find(f => f.key === field);
      if (fieldDef) labels[colIndex(col)] = fieldDef.label;
    }
    return labels;
  }, [mapping]);

  // ── Required fields validation ──
  const missingRequired = useMemo(
    () => REQUIRED_FIELDS.filter(f => !mapping[f.key]),
    [mapping],
  );

  const canImport = missingRequired.length === 0 && duplicateColumns.size === 0;

  // ── Handlers ──

  const handleFileSelect = useCallback(async (selectedFile: File) => {
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
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.xlsx')) {
      handleFileSelect(f);
    } else {
      setError('Apenas arquivos .xlsx são aceitos');
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const result = await importSpreadsheet(
        consolidationId,
        file,
        mapping as unknown as ColumnMappingConfig,
      );
      setReport(result.report);
      setStep('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar');
    } finally {
      setLoading(false);
    }
  }, [consolidationId, file, mapping]);

  // ── Column options from preview headers ──
  const columnOptions = useMemo(() =>
    preview?.headers.map((h, i) => ({
      value: colLetter(i),
      label: `${colLetter(i)} — ${h}`,
      header: h,
    })) || [],
  [preview]);

  return (
    <div>
      <Stepper currentStep={step} />

      {error && (
        <div className="mb-4 px-4 py-3 bg-brand-red/10 border border-brand-red/30 rounded-lg text-brand-red text-sm">
          {error}
        </div>
      )}

      {/* ═══════ STEP 1: File Upload ═══════ */}
      {step === 'upload' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors ${
            dragOver
              ? 'border-brand-green bg-brand-green/5'
              : 'border-gray-700 hover:border-gray-500'
          }`}
        >
          <div className="mb-4">
            <svg className="mx-auto w-12 h-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-gray-300 mb-2 text-lg">
            {loading ? 'Processando arquivo...' : 'Arraste um arquivo .xlsx aqui'}
          </p>
          <p className="text-gray-500 text-sm mb-4">ou</p>
          <label className="inline-block px-6 py-3 bg-brand-green text-gray-950 font-semibold rounded-lg cursor-pointer hover:opacity-90 transition-opacity">
            {loading ? 'Processando...' : 'Selecionar Arquivo'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              disabled={loading}
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
          </label>
          <p className="text-gray-600 text-xs mt-4">
            Apenas arquivos Excel (.xlsx) são aceitos
          </p>
        </div>
      )}

      {/* ═══════ STEP 2: Column Mapping ═══════ */}
      {step === 'mapping' && preview && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Mapeamento de Colunas</h3>
              <p className="text-sm text-gray-400">
                {file?.name} — {preview.totalRows} linhas encontradas
              </p>
            </div>
            <div className="text-sm text-gray-400">
              {REQUIRED_FIELDS.length - missingRequired.length}/{REQUIRED_FIELDS.length} campos obrigatórios mapeados
            </div>
          </div>

          {/* Data preview table with mapping highlights */}
          <div className="overflow-x-auto mb-6 rounded-lg border border-gray-800">
            <table className="text-xs w-full">
              {/* Column letter row */}
              <thead>
                <tr className="bg-gray-900/50">
                  {preview.headers.map((_h, i) => (
                    <th key={`letter-${i}`} className={`px-3 py-1 text-center font-mono text-gray-500 ${
                      mappedColumnIndices.has(i) ? 'text-brand-green' : ''
                    }`}>
                      {colLetter(i)}
                    </th>
                  ))}
                </tr>
                {/* Mapped field label row */}
                <tr className="bg-gray-900/30">
                  {preview.headers.map((_h, i) => (
                    <th key={`field-${i}`} className="px-3 py-1 text-center text-[10px]">
                      {columnFieldLabels[i] ? (
                        <span className="px-1.5 py-0.5 rounded bg-brand-green/20 text-brand-green">
                          {columnFieldLabels[i]}
                        </span>
                      ) : null}
                    </th>
                  ))}
                </tr>
                {/* Original header row */}
                <tr className="bg-gray-900 border-b border-gray-800">
                  {preview.headers.map((h, i) => (
                    <th key={i} className={`px-3 py-2 text-left text-gray-400 font-medium ${
                      mappedColumnIndices.has(i) ? 'bg-brand-green/5' : ''
                    }`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.slice(0, 4).map((row, ri) => (
                  <tr key={ri} className="border-b border-gray-800/50">
                    {row.map((cell, ci) => (
                      <td key={ci} className={`px-3 py-1.5 text-gray-300 truncate max-w-[160px] ${
                        mappedColumnIndices.has(ci) ? 'bg-brand-green/5' : ''
                      }`}>
                        {cell || <span className="text-gray-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mapping controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Required fields */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-red" />
                Campos Obrigatórios
              </h4>
              {REQUIRED_FIELDS.map(f => {
                const val = mapping[f.key] || '';
                const isDuplicate = val && duplicateColumns.has(val);
                return (
                  <div key={f.key} className="mb-3 last:mb-0">
                    <label className="flex items-center gap-3">
                      <span className="text-sm text-gray-300 w-28 shrink-0">{f.label}</span>
                      <select
                        value={val}
                        onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                        className={`flex-1 bg-gray-800 border rounded px-3 py-1.5 text-sm transition-colors ${
                          isDuplicate
                            ? 'border-brand-red text-brand-red'
                            : val
                            ? 'border-brand-green/50 text-gray-200'
                            : 'border-gray-700 text-gray-400'
                        }`}
                      >
                        <option value="">— Selecionar —</option>
                        {columnOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {val && !isDuplicate && (
                        <span className="text-brand-green text-sm">✓</span>
                      )}
                      {isDuplicate && (
                        <span className="text-brand-red text-xs">Duplicado</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>

            {/* Optional fields */}
            <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
              <h4 className="text-sm font-semibold text-gray-200 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-blue" />
                Campos Opcionais
              </h4>
              {OPTIONAL_FIELDS.map(f => {
                const val = mapping[f.key] || '';
                const isDuplicate = val && duplicateColumns.has(val);
                return (
                  <div key={f.key} className="mb-3 last:mb-0">
                    <label className="flex items-center gap-3">
                      <span className="text-sm text-gray-400 w-28 shrink-0">{f.label}</span>
                      <select
                        value={val}
                        onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value }))}
                        className={`flex-1 bg-gray-800 border rounded px-3 py-1.5 text-sm ${
                          isDuplicate
                            ? 'border-brand-red text-brand-red'
                            : val
                            ? 'border-brand-blue/50 text-gray-200'
                            : 'border-gray-700 text-gray-500'
                        }`}
                      >
                        <option value="">— Não mapear —</option>
                        {columnOptions.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      {val && !isDuplicate && (
                        <span className="text-brand-blue text-sm">✓</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Validation messages */}
          {missingRequired.length > 0 && (
            <p className="text-xs text-brand-yellow mb-4">
              Campos obrigatórios faltando: {missingRequired.map(f => f.label).join(', ')}
            </p>
          )}
          {duplicateColumns.size > 0 && (
            <p className="text-xs text-brand-red mb-4">
              Colunas duplicadas detectadas. Cada coluna pode ser mapeada para apenas um campo.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('upload'); setPreview(null); setFile(null); setError(''); }}
              className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-sm transition-colors"
            >
              Trocar Arquivo
            </button>
            <button
              onClick={() => setStep('confirm')}
              disabled={!canImport}
              className="px-6 py-2 bg-brand-green text-gray-950 font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 text-sm transition-opacity"
            >
              Revisar e Confirmar
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 3: Confirmation ═══════ */}
      {step === 'confirm' && preview && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Confirmar Importação</h3>

          {/* Summary */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Arquivo:</span>
                <span className="ml-2 font-medium">{file?.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Total de linhas:</span>
                <span className="ml-2 font-medium">{preview.totalRows}</span>
              </div>
              <div>
                <span className="text-gray-400">Consolidação:</span>
                <span className="ml-2 font-medium">#{consolidationId}</span>
              </div>
            </div>
          </div>

          {/* Mapped fields summary */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Mapeamento de Colunas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {ALL_FIELDS.map(f => {
                const col = mapping[f.key];
                if (!col) return null;
                const header = columnOptions.find(o => o.value === col)?.header;
                const isRequired = REQUIRED_FIELDS.some(r => r.key === f.key);
                return (
                  <div key={f.key} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRequired ? 'bg-brand-green' : 'bg-brand-blue'}`} />
                    <span className="text-gray-400">{f.label}:</span>
                    <span className="font-mono text-gray-200">{col}</span>
                    {header && <span className="text-gray-500 text-xs truncate">({header})</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview of mapped data */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-5 mb-6">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Pré-visualização dos dados mapeados</h4>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    {ALL_FIELDS.filter(f => mapping[f.key]).map(f => (
                      <th key={f.key} className="px-2 py-1.5 text-left text-gray-400 font-medium">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sampleRows.slice(0, 3).map((row, ri) => (
                    <tr key={ri} className="border-b border-gray-800/50">
                      {ALL_FIELDS.filter(f => mapping[f.key]).map(f => {
                        const ci = colIndex(mapping[f.key]);
                        return (
                          <td key={f.key} className="px-2 py-1.5 text-gray-300 truncate max-w-[140px]">
                            {row[ci] || <span className="text-gray-600">—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('mapping')}
              className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-sm transition-colors"
            >
              Voltar ao Mapeamento
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-brand-green text-gray-950 font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm transition-opacity"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" />
                  Importando...
                </span>
              ) : (
                `Importar ${preview.totalRows} linhas`
              )}
            </button>
          </div>
        </div>
      )}

      {/* ═══════ STEP 4: Result ═══════ */}
      {step === 'result' && report && (
        <div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-brand-green/20 flex items-center justify-center">
                <span className="text-brand-green text-lg">✓</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-green">Importação Concluída</h3>
                <p className="text-sm text-gray-400">{file?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-green">{report.lineItemsCreated}</p>
                <p className="text-xs text-gray-400 mt-1">Itens de Linha</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-blue">{report.newItems}</p>
                <p className="text-xs text-gray-400 mt-1">Novos Itens</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-yellow">{report.updatedItems}</p>
                <p className="text-xs text-gray-400 mt-1">Atualizados</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-brand-purple">{report.newSuppliers}</p>
                <p className="text-xs text-gray-400 mt-1">Novos Fornecedores</p>
              </div>
            </div>

            {report.errors.length > 0 && (
              <div className="mt-5 p-4 bg-brand-red/5 border border-brand-red/20 rounded-lg">
                <h4 className="text-sm font-medium text-brand-red mb-2">
                  {report.errors.length} {report.errors.length === 1 ? 'erro' : 'erros'} durante importação
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {report.errors.map((e, i) => (
                    <p key={i} className="text-xs text-gray-400">
                      <span className="text-brand-red">Linha {e.row}:</span> {e.field} — {e.message}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/consolidacoes/${consolidationId}`)}
              className="px-6 py-2 bg-brand-green text-gray-950 font-semibold rounded-lg hover:opacity-90 text-sm transition-opacity"
            >
              Ver Consolidação
            </button>
            <button
              onClick={() => {
                setStep('upload');
                setFile(null);
                setPreview(null);
                setMapping({});
                setReport(null);
                setError('');
              }}
              className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 text-sm transition-colors"
            >
              Importar Outro Arquivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
