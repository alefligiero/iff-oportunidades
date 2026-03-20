"use client";

import { useEffect, useMemo, useState } from 'react';
import { DocumentStatus, InternshipStatus } from '@prisma/client';

interface Props {
  internshipId: string;
  status: InternshipStatus;
  currentEndDate: string;
  internshipExtensionRequested: boolean;
  internshipExtensionApproved: boolean | null;
  internshipExtensionReason: string | null;
  internshipExtensionHandledAt: string | null;
  internshipExtensionRejectionReason: string | null;
  internshipExtensionStartDate: string | null;
  internshipExtensionEndDate: string | null;
  extensionTermStatus: DocumentStatus | null;
}

function getNextDayISO(dateIso: string) {
  const base = new Date(dateIso);
  const next = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() + 1));
  return next.toISOString().slice(0, 10);
}

function compareDateOnly(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export default function RequestInternshipExtension(props: Props) {
  const {
    internshipId,
    status,
    currentEndDate,
    internshipExtensionRequested,
    internshipExtensionApproved,
    internshipExtensionReason,
    internshipExtensionHandledAt,
    internshipExtensionRejectionReason,
    internshipExtensionStartDate,
    internshipExtensionEndDate,
    extensionTermStatus,
  } = props;

  const defaultStartDate = useMemo(() => getNextDayISO(currentEndDate), [currentEndDate]);
  const defaultEndDate = useMemo(() => getNextDayISO(defaultStartDate), [defaultStartDate]);

  const [reason, setReason] = useState('');
  const [requested, setRequested] = useState(internshipExtensionRequested);
  const [approved, setApproved] = useState(internshipExtensionApproved);
  const [handledAt, setHandledAt] = useState(internshipExtensionHandledAt);
  const [requestReason, setRequestReason] = useState(internshipExtensionReason);
  const [rejectionReason, setRejectionReason] = useState(internshipExtensionRejectionReason);
  const [currentExtensionTermStatus, setCurrentExtensionTermStatus] = useState<DocumentStatus | null>(extensionTermStatus);
  const [startDate, setStartDate] = useState(internshipExtensionStartDate ?? defaultStartDate);
  const [endDate, setEndDate] = useState(internshipExtensionEndDate ?? defaultEndDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRequested(internshipExtensionRequested);
    setApproved(internshipExtensionApproved);
    setHandledAt(internshipExtensionHandledAt);
    setRequestReason(internshipExtensionReason);
    setRejectionReason(internshipExtensionRejectionReason);
    setCurrentExtensionTermStatus(extensionTermStatus);
    setStartDate(internshipExtensionStartDate ?? defaultStartDate);
    setEndDate(internshipExtensionEndDate ?? defaultEndDate);
  }, [
    internshipExtensionRequested,
    internshipExtensionApproved,
    internshipExtensionHandledAt,
    internshipExtensionReason,
    internshipExtensionRejectionReason,
    extensionTermStatus,
    internshipExtensionStartDate,
    internshipExtensionEndDate,
    defaultStartDate,
    defaultEndDate,
  ]);

  const alreadyDecided = approved !== null && handledAt !== null;
  const canRequest = status === InternshipStatus.IN_PROGRESS && !requested;
  const shouldShowSection = requested || alreadyDecided || canRequest;

  const submit = async () => {
    const trimmedReason = reason.trim();

    if (!trimmedReason) {
      setError('Informe uma justificativa para solicitar a prorrogação.');
      return;
    }

    if (trimmedReason.length < 10) {
      setError('A justificativa deve ter pelo menos 10 caracteres.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Informe as datas da prorrogação.');
      return;
    }

    if (compareDateOnly(endDate, startDate) <= 0) {
      setError('A data final da prorrogação deve ser posterior à data inicial.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/internships/${internshipId}/extension-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          reason: trimmedReason,
          extensionStartDate: startDate,
          extensionEndDate: endDate,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (data?.details && typeof data.details === 'object') {
          const detailMessages = Object.values(data.details)
            .flatMap((messages) => (Array.isArray(messages) ? messages : []))
            .filter((message): message is string => typeof message === 'string' && message.length > 0);

          if (detailMessages.length > 0) {
            throw new Error(detailMessages[0]);
          }
        }

        throw new Error(data.error || 'Não foi possível enviar a solicitação de prorrogação.');
      }

      setRequested(true);
      setApproved(null);
      setHandledAt(null);
      setRequestReason(trimmedReason);
      setRejectionReason(null);
      setReason('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!shouldShowSection) {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">Prorrogação de estágio</h3>

      <p className="text-sm text-gray-700">
        Data de término atual: <span className="font-medium">{new Date(currentEndDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
      </p>

      {requested && !alreadyDecided && (
        <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          Solicitação enviada e aguardando análise da Agência.
          {requestReason && (
            <div className="mt-1 text-gray-600">Justificativa: {requestReason}</div>
          )}
          {startDate && endDate && (
            <div className="mt-1 text-gray-600">
              Período solicitado: {new Date(`${startDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até {new Date(`${endDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
          )}
        </div>
      )}

      {alreadyDecided && approved === true && currentExtensionTermStatus === null && (
        <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div>Prorrogação aprovada em {new Date(handledAt as string).toLocaleString('pt-BR')}.</div>
          {startDate && endDate && (
            <div className="mt-1 text-yellow-800">
              Período aprovado: {new Date(`${startDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até {new Date(`${endDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
          )}
          <div className="mt-2 font-medium">
            Atenção: para efetivar a prorrogação, baixe o TCE Aditivo, colete as assinaturas e envie o documento para análise.
          </div>
        </div>
      )}

      {alreadyDecided && approved === true && currentExtensionTermStatus === DocumentStatus.REJECTED && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <div>Prorrogação aprovada em {new Date(handledAt as string).toLocaleString('pt-BR')}.</div>
          <div className="mt-2 font-medium">
            O Termo Aditivo foi recusado. Reenvie o documento assinado para efetivar a prorrogação.
          </div>
        </div>
      )}

      {alreadyDecided && approved === true && currentExtensionTermStatus !== null && currentExtensionTermStatus !== DocumentStatus.REJECTED && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <div>Prorrogação aprovada em {new Date(handledAt as string).toLocaleString('pt-BR')}.</div>
          {startDate && endDate && (
            <div className="mt-1 text-green-700">
              Período aprovado: {new Date(`${startDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} até {new Date(`${endDate}T00:00:00.000Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
          )}
          <div className="mt-2">
            {currentExtensionTermStatus === DocumentStatus.PENDING_ANALYSIS
              ? 'Termo Aditivo enviado e em análise.'
              : 'Termo Aditivo enviado.'}
          </div>
        </div>
      )}

      {alreadyDecided && approved === false && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
          <div>Prorrogação recusada em {new Date(handledAt as string).toLocaleString('pt-BR')}.</div>
          {rejectionReason && (
            <div className="mt-2 text-red-600 font-medium">Motivo: {rejectionReason}</div>
          )}
        </div>
      )}

      {canRequest && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-medium text-gray-700">
              Início da prorrogação
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full border rounded-md p-2 text-sm text-gray-800"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              Fim da prorrogação
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full border rounded-md p-2 text-sm text-gray-800"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-gray-700">Justificativa</label>
          <textarea
            className="w-full border rounded-md p-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-600 placeholder-gray-500"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Descreva por que precisa prorrogar o estágio."
          />
          <p className="text-xs text-gray-500">
            Regra: o estágio deve começar a prorrogação no dia seguinte ao término atual e não pode ultrapassar 24 meses totais.
          </p>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submit}
            disabled={isLoading}
            className="px-4 py-2 bg-green-700 text-white rounded-md text-sm hover:bg-green-800 disabled:bg-green-300"
          >
            {isLoading ? 'Enviando...' : 'Solicitar prorrogação'}
          </button>
        </div>
      )}
    </div>
  );
}
