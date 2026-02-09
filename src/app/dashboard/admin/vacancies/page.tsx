'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import VacanciesPageContent from './VacanciesPageContent';

interface Vacancy {
  id: string;
  title: string;
  status: string;
  type: string;
  modality: string;
  remuneration: number;
  workload: number;
  createdAt: string;
  updatedAt: string;
  closureReason?: string | null;
  company: {
    name: string;
  };
  eligibleCourses: any[];
}

function VacanciesPageLoader() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVacancies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/vacancies/all');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar vagas');
        }

        const data = await response.json();
        setVacancies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar vagas');
      } finally {
        setLoading(false);
      }
    };

    fetchVacancies();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-green-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return <VacanciesPageContent allVacancies={vacancies} />;
}

export default function VacanciesPage() {
  return (
    <AuthGuard requiredRole="ADMIN" redirectTo="/">
      <VacanciesPageLoader />
    </AuthGuard>
  );
}
