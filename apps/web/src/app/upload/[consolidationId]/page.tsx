'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getConsolidation } from '@/lib/api';
import UploadWizard from '@/components/UploadWizard';
import type { Consolidation } from '@/types/api';

export default function UploadPage() {
  const params = useParams();
  const consolidationId = Number(params.consolidationId);
  const [consolidation, setConsolidation] = useState<Consolidation | null>(null);

  useEffect(() => {
    getConsolidation(consolidationId).then(setConsolidation).catch(() => {});
  }, [consolidationId]);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/consolidacoes/${consolidationId}`}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          &larr; Voltar
        </Link>
        <h1 className="text-2xl font-bold">
          Upload — {consolidation ? `${consolidation.meetingNumber}ª Reunião` : 'Carregando...'}
        </h1>
      </div>
      <UploadWizard consolidationId={consolidationId} />
    </div>
  );
}
