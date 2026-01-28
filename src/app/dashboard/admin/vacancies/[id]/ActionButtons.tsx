'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VacancyStatus } from '@prisma/client';

interface Props {
  vacancyId: string;
  status: VacancyStatus;
}

export default function ActionButtons({ vacancyId, status }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'rejection' | 'closure' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [closureReason, setClosureReason] = useState('');

  const canApprove = status === VacancyStatus.PENDING_APPROVAL;
  const canReject = status === VacancyStatus.PENDING_APPROVAL;
  const canClose = status !== VacancyStatus.CLOSED_BY_ADMIN && status !== VacancyStatus.CLOSED_BY_COMPANY;

  const handleApprove = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: VacancyStatus.APPROVED }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao aprovar vaga.');
      }

      alert('Vaga aprovada com sucesso!');
      router.push('/dashboard/admin/vacancies');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectClick = () => {
    setRejectionReason('');
    setModalType('rejection');
    setIsModalOpen(true);
  };

  const confirmRejection = async () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, insira um motivo para a recusa.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: VacancyStatus.REJECTED,
          rejectionReason: rejectionReason,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao recusar vaga.');
      }

      alert('Vaga recusada com sucesso!');
      router.push('/dashboard/admin/vacancies');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
      setModalType(null);
    }
  };

  const handleCloseClick = () => {
    setClosureReason('');
    setModalType('closure');
    setIsModalOpen(true);
  };

  const confirmClosure = async () => {
    if (!closureReason.trim()) {
      alert('Por favor, insira um motivo para o fechamento.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/vacancies/${vacancyId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: VacancyStatus.CLOSED_BY_ADMIN,
          closureReason: closureReason,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Falha ao fechar vaga.');
      }

      alert('Vaga fechada com sucesso!');
      router.push('/dashboard/admin/vacancies');
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro inesperado';
      setError(message);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações de Moderação</h3>
        <p className="text-sm text-gray-600 mb-4">
          Revise os detalhes da vaga e aprove ou recuse a publicação.
        </p>

        {canApprove || canReject ? (
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleApprove}
              disabled={isLoading || !canApprove}
              className="button-primary px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300"
            >
              {isLoading ? 'A processar...' : 'Aprovar vaga'}
            </button>
            <button
              onClick={handleRejectClick}
              disabled={isLoading || !canReject}
              className="button-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300"
            >
              {isLoading ? 'A processar...' : 'Recusar vaga'}
            </button>
            {canClose && (
              <button
                onClick={handleCloseClick}
                disabled={isLoading}
                className="button-primary px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300"
              >
                {isLoading ? 'A processar...' : 'Fechar vaga'}
              </button>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-sm text-gray-700">
              Esta vaga já foi {status === 'APPROVED' ? 'aprovada' : status === 'REJECTED' ? 'recusada' : 'fechada'}.
              {canClose && <> Você ainda pode fechar esta vaga.</>}
            </p>
            {canClose && (
              <button
                onClick={handleCloseClick}
                disabled={isLoading}
                className="mt-3 button-primary px-4 py-2 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300"
              >
                {isLoading ? 'A processar...' : 'Fechar vaga'}
              </button>
            )}
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}
      </div>

      {/* Modal de Rejeição e Fechamento */}
      {isModalOpen && modalType === 'rejection' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">Motivo da Recusa</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Por favor, descreva o motivo pelo qual a vaga está sendo recusada. Esta informação será armazenada no sistema.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-form w-full text-gray-800 placeholder-gray-500"
              rows={4}
              placeholder="Ex: Descrição insuficiente, informações incompletas, violação de políticas..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalType(null);
                }}
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

      {/* Modal de Fechamento */}
      {isModalOpen && modalType === 'closure' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity animate-fadeIn">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-md transform animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900">Motivo do Fechamento</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Por favor, descreva o motivo pelo qual a vaga está sendo fechada. Esta informação será armazenada no sistema.
            </p>
            <textarea
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              className="input-form w-full text-gray-800 placeholder-gray-500"
              rows={4}
              placeholder="Ex: Vaga já preenchida, não mais necessária, oferecida internamente..."
            />
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setModalType(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClosure}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 rounded-lg disabled:bg-gray-300"
              >
                {isLoading ? 'A enviar...' : 'Confirmar Fechamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
