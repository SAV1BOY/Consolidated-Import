'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConsolidation } from '@/lib/api';
import { formatDate, formatNumber } from '@/lib/format';
import UploadWizard from '@/components/UploadWizard';
import type { Consolidation } from '@/types/api';

export default function UploadPage() {
  const params = useParams();
  const consolidationId = Number(params.consolidationId);
  const [consolidation, setConsolidation] = useState<Consolidation | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getConsolidation(consolidationId)
      .then(setConsolidation)
      .catch(() => setError('Consolidação não encontrada'));
  }, [consolidationId]);

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-red mb-4">{error}</p>
        <Link href="/consolidacoes" className="text-brand-green hover:underline">
          Voltar para Consolidações
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/consolidacoes/${consolidationId}`}
          className="text-sm text-gray-400 hover:text-gray-200 inline-flex items-center gap-1 mb-2"
        >
          &larr; Voltar para Consolidação
        </Link>
        <h1 className="text-2xl font-bold">Importar Planilha</h1>
        {consolidation && (
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <span className="font-medium text-gray-200">
              {consolidation.meetingNumber}ª Reunião
            </span>
            {consolidation.description && (
              <>
                <span className="text-gray-600">|</span>
                <span>{consolidation.description}</span>
              </>
            )}
            <span className="text-gray-600">|</span>
            <span>{formatDate(consolidation.meetingDate)}</span>
            <span className="text-gray-600">|</span>
            <span>Câmbio: {formatNumber(consolidation.exchangeRate, 4)}</span>
            {consolidation.lineItems && consolidation.lineItems.length > 0 && (
              <>
                <span className="text-gray-600">|</span>
                <span className="text-brand-yellow">
                  {consolidation.lineItems.length} itens já importados
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Wizard */}
      {consolidation ? (
        <UploadWizard consolidationId={consolidationId} />
      ) : (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      )}
    </div>
  );
}
