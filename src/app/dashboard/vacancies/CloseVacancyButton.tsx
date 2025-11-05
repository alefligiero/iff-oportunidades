'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CloseVacancyButtonProps {
  vacancyId: string;
  vacancyTitle: string;
  status: string;
}

export default function CloseVacancyButton({ vacancyId, vacancyTitle, status }: CloseVacancyButtonProps) {
  const [isClosing, setIsClosing] = useState(false);
  const router = useRouter();

  // Não mostrar botão se a vaga já está fechada
  if (status === 'CLOSED_BY_COMPANY') {
    return null;
  }

  const handleClose = async () => {
    if (!confirm(`Tem certeza que deseja fechar a vaga "${vacancyTitle}"?\n\nEsta ação irá remover a vaga da visualização dos estudantes.`)) {
      return;
    }

    setIsClosing(true);

    try {
      const response = await fetch(`/api/company/vacancies/${vacancyId}/close`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Recarregar a página para atualizar a lista
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao fechar a vaga.');
        setIsClosing(false);
      }
    } catch (error) {
      alert('Erro ao conectar com o servidor.');
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
