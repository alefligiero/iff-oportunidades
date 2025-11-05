'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { VacancyType } from '@prisma/client';

interface Company {
  name: string;
}

interface Vacancy {
  id: string;
  title: string;
  description: string;
  type: VacancyType;
  remuneration: number;
  workload: number;
  createdAt: string;
  updatedAt: string;
  company: Company;
}

export default function ApprovedVacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const response = await fetch('/api/admin/vacancies/approved');
      if (response.ok) {
        const data = await response.json();
        setVacancies(data);
      } else {
        setError('Erro ao carregar vagas aprovadas.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vacancyId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta vaga? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(vacancyId);
    setError('');

    try {
      const response = await fetch(`/api/admin/vacancies/${vacancyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVacancies(prev => prev.filter(v => v.id !== vacancyId));
      } else {
        const data = await response.json();
        setError(data.error || 'Erro ao deletar vaga.');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600">Carregando vagas aprovadas...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Vagas Aprovadas</h1>
        <Link
          href="/dashboard/admin/vacancies"
          className="text-green-700 hover:text-green-900 font-medium"
        >
          ← Vagas Pendentes
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {vacancies.length === 0 ? (
          <p className="text-gray-700">Não há vagas aprovadas no momento.</p>
        ) : (
          <div className="space-y-4">
            {vacancies.map((vacancy) => (
              <div
                key={vacancy.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-green-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{vacancy.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Empresa: <span className="font-medium">{vacancy.company.name}</span>
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                      <span className="flex items-center">
                        <span className="font-medium mr-1">Tipo:</span>
                        {vacancy.type === 'INTERNSHIP' ? '🎓 Estágio' : '💼 Emprego'}
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium mr-1">Remuneração:</span>
                        {formatCurrency(vacancy.remuneration)}
                      </span>
                      <span className="flex items-center">
                        <span className="font-medium mr-1">Carga horária:</span>
                        {vacancy.workload}h/semana
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Aprovada em: {formatDate(vacancy.updatedAt)}
                    </p>
                  </div>
                  <span className="ml-4 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    Aprovada
                  </span>
                </div>

                {/* Descrição expandível */}
                {expandedId === vacancy.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-line">{vacancy.description}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => toggleExpanded(vacancy.id)}
                    className="text-sm font-medium text-blue-700 hover:text-blue-900"
                  >
                    {expandedId === vacancy.id ? '▲ Ocultar Detalhes' : '▼ Ver Detalhes'}
                  </button>
                  <button
                    onClick={() => handleDelete(vacancy.id)}
                    disabled={deletingId === vacancy.id}
                    className="text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-50"
                  >
                    {deletingId === vacancy.id ? '🗑️ Deletando...' : '🗑️ Deletar Vaga'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
