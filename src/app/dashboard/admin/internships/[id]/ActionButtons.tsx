'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InternshipStatus } from '@prisma/client';

export default function ActionButtons({ internshipId }: { internshipId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleUpdateStatus = async (status: InternshipStatus, reason?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const body: { status: InternshipStatus, rejectionReason?: string } = { status };
      if (status === InternshipStatus.CANCELED && reason) {
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

      alert(`Estágio ${status === 'APPROVED' ? 'aprovado' : 'recusado'} com sucesso!`);
      router.push('/dashboard/admin/internships');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  const handleRejectClick = () => {
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const confirmRejection = () => {
    if (!rejectionReason.trim()) {
      alert('Por favor, insira um motivo para a recusa.');
      return;
    }
    handleUpdateStatus(InternshipStatus.CANCELED, rejectionReason);
  };

  return (
    <>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleUpdateStatus(InternshipStatus.APPROVED)}
          disabled={isLoading}
          className="button-primary px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300"
        >
          {isLoading ? 'A processar...' : 'Aprovar'}
        </button>
        <button
          onClick={handleRejectClick}
          disabled={isLoading}
          className="button-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300"
        >
          {isLoading ? 'A processar...' : 'Recusar'}
        </button>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900">Motivo da Recusa</h3>
            <p className="text-sm text-gray-600 mt-2 mb-4">
              Por favor, descreva o motivo pelo qual o estágio está a ser recusado. Esta informação será partilhada com o aluno.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-form w-full"
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
    </>
  );
}
