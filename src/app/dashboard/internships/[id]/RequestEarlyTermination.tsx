"use client";

import { useState } from 'react';
import { InternshipStatus } from '@prisma/client';

interface Props {
  internshipId: string;
  status: InternshipStatus;
  earlyTerminationRequested: boolean;
  earlyTerminationApproved: boolean | null;
  earlyTerminationReason: string | null;
  earlyTerminationHandledAt: string | null;
}

export default function RequestEarlyTermination(props: Props) {
  const {
    internshipId,
    status,
    earlyTerminationRequested,
    earlyTerminationApproved,
    earlyTerminationReason,
    earlyTerminationHandledAt,
  } = props;

  const [reason, setReason] = useState('');
  const [requested, setRequested] = useState(earlyTerminationRequested);
  const [approved, setApproved] = useState(earlyTerminationApproved);
  const [handledAt, setHandledAt] = useState(earlyTerminationHandledAt);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyDecided = approved !== null && handledAt !== null;

  const canRequest =
    status !== InternshipStatus.CANCELED &&
    status !== InternshipStatus.FINISHED &&
    !requested;

  const submit = async () => {
    if (!reason.trim()) {
      setError('Informe uma justificativa.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/internships/${internshipId}/early-termination`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Não foi possível enviar a solicitação.');
      }
      setRequested(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Encerramento antecipado</h3>

      {requested && !alreadyDecided && (
        <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          Solicitação enviada e aguardando análise da Agência.
          {earlyTerminationReason && (
            <div className="mt-1 text-gray-600">Justificativa: {earlyTerminationReason}</div>
          )}
        </div>
      )}

      {requested && alreadyDecided && approved === true && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          Encerramento antecipado aprovado em {new Date(handledAt as string).toLocaleString('pt-BR')}.
        </div>
      )}

      {requested && alreadyDecided && approved === false && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          Encerramento antecipado recusado em {new Date(handledAt as string).toLocaleString('pt-BR')}.
        </div>
      )}

      {canRequest && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Justificativa</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva por que precisa encerrar o estágio antes do prazo."
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={isLoading}
            className="px-4 py-2 bg-green-700 text-white rounded-md text-sm hover:bg-green-800 disabled:bg-green-300"
          >
            {isLoading ? 'Enviando...' : 'Solicitar encerramento'}
          </button>
        </div>
      )}
    </div>
  );
}
