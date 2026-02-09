'use client';

import Link from 'next/link';
import { VacancyStatus, VacancyType, VacancyModality, Course } from '@prisma/client';

const typeMap: { [key in VacancyType]: string } = {
  INTERNSHIP: 'Estágio',
  JOB: 'Emprego',
};

const modalityMap: { [key in VacancyModality]: string } = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
};

const statusBadgeMap: { [key in VacancyStatus]: { text: string; color: string } } = {
  PENDING_APPROVAL: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { text: 'Aprovada', color: 'bg-green-100 text-green-800' },
  REJECTED: { text: 'Rejeitada', color: 'bg-red-100 text-red-800' },
  CLOSED_BY_COMPANY: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
  CLOSED_BY_ADMIN: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
};

interface Vacancy {
  id: string;
  title: string;
  status: VacancyStatus;
  type: VacancyType;
  modality: VacancyModality;
  remuneration: number;
  workload: number;
  createdAt: string;
  updatedAt: string;
  closureReason?: string | null;
  company: { name: string };
  eligibleCourses: Course[];
}

interface VacancyTableProps {
  vacancies: Vacancy[];
  loading?: boolean;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function VacancyTable({ vacancies, loading = false }: VacancyTableProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (vacancies.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600">Nenhuma vaga encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Modalidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Remuneração
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carga Horária
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {vacancies.map((vacancy) => (
              <tr key={vacancy.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vacancy.title}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vacancy.company.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{typeMap[vacancy.type]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{modalityMap[vacancy.modality]}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatCurrency(vacancy.remuneration)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{vacancy.workload}h/semana</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusBadgeMap[vacancy.status].color
                      }`}
                    >
                      {statusBadgeMap[vacancy.status].text}
                    </span>
                    {(vacancy.status === VacancyStatus.CLOSED_BY_ADMIN || vacancy.status === VacancyStatus.CLOSED_BY_COMPANY) && vacancy.closureReason && (
                      <span className="text-xs text-gray-600 whitespace-pre-line">
                        {vacancy.closureReason}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard/admin/vacancies/${vacancy.id}`}
                    className="text-blue-600 hover:text-blue-800 transition"
                  >
                    Ver Detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
