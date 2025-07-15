'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InternshipStatus } from '@prisma/client';

export default function ActionButtons({ internshipId }: { internshipId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (status: InternshipStatus) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/internships/${internshipId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
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
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={() => handleUpdateStatus(InternshipStatus.APPROVED)}
        disabled={isLoading}
        className="button-primary px-4 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-300"
      >
        {isLoading ? 'A processar...' : 'Aprovar'}
      </button>
      <button
        onClick={() => handleUpdateStatus(InternshipStatus.CANCELED)} // Usando CANCELED como "recusado"
        disabled={isLoading}
        className="button-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:bg-red-300"
      >
        {isLoading ? 'A processar...' : 'Recusar'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
