'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InternshipStatus } from '@prisma/client';
import { useNotification } from '@/contexts/NotificationContext';

interface Document {
  type: string;
  status: string;
  fileUrl?: string | null;
}

interface Props {
  internshipId: string;
  internshipStatus: InternshipStatus;
  earlyTerminationRequested: boolean;
  earlyTerminationApproved: boolean | null;
  earlyTerminationReason: string | null;
  documents?: Document[];
}

export default function ActionButtons({
  internshipId,
  internshipStatus,
  earlyTerminationRequested,
  earlyTerminationApproved,
  earlyTerminationReason,
  documents = [],
}: Props) {
  const router = useRouter();
  const { addNotification } = useNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [earlyModalOpen, setEarlyModalOpen] = useState(false);
  const [earlyRejectionReason, setEarlyRejectionReason] = useState('');

  const canModerateFormalization = internshipStatus === InternshipStatus.IN_ANALYSIS;
  
  // Bloqueia apenas quando TCE/PAE assinados estiverem pendentes de análise
  const hasSignedContractPending = documents.some(
    (doc) => doc.type === 'SIGNED_CONTRACT' && doc.status === 'PENDING_ANALYSIS' && Boolean(doc.fileUrl)
  );
  const isReadyForApproval = canModerateFormalization && !hasSignedContractPending;

  const handleUpdateStatus = async (status: InternshipStatus, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const body: { status: InternshipStatus; rejectionReason?: string } = { status };
      if (status === InternshipStatus.REJECTED && reason) {
        body.rejectionReason = reason;
      }

      const response = await fetch(`/api/admin/internships/${internshipId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao atualizar o estado.');
      }

      addNotification('success', `Estágio ${status === 'APPROVED' ? 'aprovado' : 'recusado'} com sucesso!`);
      router.push('/dashboard/admin/internships');
      router.refresh();

    } catch (rawError) {
      const err = rawError instanceof Error ? rawError : new Error('Erro desconhecido');
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleEarlyTermination = async (action: 'APPROVE' | 'REJECT', reason?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/internships/${internshipId}/early-termination`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, rejectionReason: reason }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Falha ao decidir encerramento.');
      }

      addNotification('success', `Encerramento antecipado ${action === 'APPROVE' ? 'aprovado' : 'recusado'} com sucesso!`);
      router.refresh();
    } catch (rawError) {
      const err = rawError instanceof Error ? rawError : new Error('Erro desconhecido');
      setError(err.message);
    } finally {
      setIsLoading(false);
      setEarlyModalOpen(false);
    }
  };

  const handleRejectClick = () => {
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      addNotification('warning', 'Por favor, insira um motivo para a recusa.');
      return;
    }
    handleUpdateStatus(InternshipStatus.REJECTED, rejectionReason);
  };

  return (
    <>
      {canModerateFormalization ? (
        <div className="space-y-4">
          {!isReadyForApproval ? (
            <div className="border border-red-200 bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Documentos pendentes de análise:</strong>
              </p>
              <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                <li>TCE + PAE assinados (PDF único)</li>
              </ul>
              <p className="text-sm text-red-700 mt-2">
                As ações de aprovação/recusa ficarão disponíveis após a análise dos documentos assinados.
              </p>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleUpdateStatus(InternshipStatus.APPROVED)}
                disabled={isLoading}
                className="button-primary px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300"
              >
                {isLoading ? 'A processar...' : 'Aprovar formalização'}
              </button>
              <button
                onClick={handleRejectClick}
                disabled={isLoading}
                className="button-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300"
              >
                {isLoading ? 'A processar...' : 'Recusar formalização'}
              </button>
            </div>
          )}
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        <p className="text-sm text-gray-600">A formalização já foi analisada.</p>
      )}

      {earlyTerminationRequested && (
        <div className="mt-6 border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-3">
          <div className="text-sm text-gray-800">
            <strong>Solicitação de encerramento antecipado</strong>
            {earlyTerminationReason && (
              <div className="mt-1 text-gray-700">Justificativa do aluno: {earlyTerminationReason}</div>
            )}
          </div>

          {earlyTerminationApproved === null ? (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleEarlyTermination('APPROVE')}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:bg-green-300"
              >
                {isLoading ? 'A processar...' : 'Aprovar encerramento'}
              </button>
              <button
                onClick={() => {
                  setEarlyRejectionReason('');
                  setEarlyModalOpen(true);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300"
              >
                {isLoading ? 'A processar...' : 'Recusar encerramento'}
              </button>
            </div>
          ) : earlyTerminationApproved ? (
            <div className="text-sm text-green-700">Encerramento antecipado aprovado.</div>
          ) : (
            <div className="text-sm text-red-700">Encerramento antecipado recusado.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">Motivo da Recusa</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Por favor, descreva o motivo pelo qual o estágio está a ser recusado. Esta informação será partilhada com o aluno.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-form w-full text-gray-800 placeholder-gray-500"
              rows={4}
              placeholder="Ex: Documentação incompleta, falta do comprovativo do seguro..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRejection}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300"
              >
                {isLoading ? 'A enviar...' : 'Confirmar Recusa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {earlyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">Motivo da recusa do encerramento</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Explique por que o encerramento antecipado está a ser recusado. Esta informação será partilhada com o aluno.
            </p>
            <textarea
              value={earlyRejectionReason}
              onChange={(e) => setEarlyRejectionReason(e.target.value)}
              className="input-form w-full text-gray-800 placeholder-gray-500"
              rows={4}
              placeholder="Ex: Necessário entregar relatório pendente antes de encerrar."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setEarlyModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!earlyRejectionReason.trim()) {
                    addNotification('warning', 'Informe o motivo da recusa.');
                    return;
                  }
                  handleEarlyTermination('REJECT', earlyRejectionReason);
                }}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-red-300"
              >
                {isLoading ? 'A enviar...' : 'Confirmar recusa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Tailwind keyframes (se não existirem, adicionar em config para produção)
@layer utilities {
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes scaleIn { from { opacity:0; transform: scale(.95) } to { opacity:1; transform: scale(1)} }
  .animate-fadeIn { animation: fadeIn .18s ease-out; }
  .animate-scaleIn { animation: scaleIn .18s ease-out; }
}
*/
