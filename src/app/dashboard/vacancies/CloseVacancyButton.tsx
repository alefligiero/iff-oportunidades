'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '@/contexts/NotificationContext';

interface CloseVacancyButtonProps {
  vacancyId: string;
  vacancyTitle: string;
  status: string;
}

export default function CloseVacancyButton({ vacancyId, vacancyTitle, status }: CloseVacancyButtonProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const { addNotification } = useNotification();

  // Não mostrar botão se a vaga já está fechada
  if (status === 'CLOSED_BY_COMPANY') {
    return null;
  }

  const handleClose = async () => {
    if (!confirmPending) {
      setConfirmPending(true);
      addNotification('warning', `Clique novamente para confirmar o fechamento da vaga "${vacancyTitle}".`);

      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }

      confirmTimeoutRef.current = setTimeout(() => {
        setConfirmPending(false);
      }, 5000);
      return;
    }

    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = null;
    }
    setConfirmPending(false);

    setIsClosing(true);

    try {
      const response = await fetch(`/api/company/vacancies/${vacancyId}/close`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Recarregar a página para atualizar a lista
        addNotification('success', 'Vaga fechada com sucesso.');
        router.refresh();
      } else {
        const data = await response.json();
        addNotification('error', data.error || 'Erro ao fechar a vaga.');
        setIsClosing(false);
      }
    } catch (error) {
      addNotification('error', 'Erro ao conectar com o servidor.');
      setIsClosing(false);
    }
  };

  return (
    <button
      onClick={handleClose}
      disabled={isClosing}
      className="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
    >
      {isClosing ? '🔒 Fechando...' : '🔒 Fechar Vaga'}
    </button>
  );
}
