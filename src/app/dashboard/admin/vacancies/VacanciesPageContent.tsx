'use client';

import { useState, useMemo } from 'react';
import { VacancyStatus, VacancyType, VacancyModality, Course } from '@prisma/client';
import VacancyTabs from './VacancyTabs';
import VacancyFilters, { FilterState } from './VacancyFilters';
import VacancyTable from './VacancyTable';

type TabStatus = VacancyStatus | 'CLOSED';

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
  company: { name: string };
  eligibleCourses: Course[];
}

interface VacanciesPageContentProps {
  allVacancies: Vacancy[];
}

export default function VacanciesPageContent({ allVacancies }: VacanciesPageContentProps) {
  const [activeStatus, setActiveStatus] = useState<TabStatus>(VacancyStatus.PENDING_APPROVAL);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    course: '',
    type: '',
    modality: '',
  });

  // Contar vagas por status
  const counts = useMemo(() => {
    const result: { [key in VacancyStatus]: number } = {
      PENDING_APPROVAL: 0,
      APPROVED: 0,
      REJECTED: 0,
      CLOSED_BY_COMPANY: 0,
      CLOSED_BY_ADMIN: 0,
    };

    allVacancies.forEach((vacancy) => {
      result[vacancy.status]++;
    });

    return result;
  }, [allVacancies]);

  // Filtrar vagas
  const filteredVacancies = useMemo(() => {
    let result;

    if (activeStatus === 'CLOSED') {
      // Mostrar ambas fechadas
      result = allVacancies.filter(
        (vacancy) => vacancy.status === VacancyStatus.CLOSED_BY_COMPANY || vacancy.status === VacancyStatus.CLOSED_BY_ADMIN
      );
    } else {
      result = allVacancies.filter((vacancy) => vacancy.status === activeStatus);
    }

    // Busca por título da vaga ou nome da empresa
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (vacancy) =>
          vacancy.title.toLowerCase().includes(searchLower) ||
          vacancy.company.name.toLowerCase().includes(searchLower)
      );
    }

    // Curso elegível
    if (filters.course) {
      result = result.filter((vacancy) => vacancy.eligibleCourses.includes(filters.course as Course));
    }

    // Tipo
    if (filters.type) {
      result = result.filter((vacancy) => vacancy.type === filters.type);
    }

    // Modalidade
    if (filters.modality) {
      result = result.filter((vacancy) => vacancy.modality === filters.modality);
    }

    // Ordenação por status
    if (activeStatus === VacancyStatus.PENDING_APPROVAL) {
      // Pendentes: mais antigo primeiro
      result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      // Outros: mais recente primeiro (preferir updatedAt)
      result.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return result;
  }, [allVacancies, activeStatus, filters]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Vagas</h1>
        <p className="text-gray-600 text-sm mt-1">Visualize e gerencie todas as vagas</p>
      </div>

      <VacancyTabs activeStatus={activeStatus} onStatusChange={setActiveStatus} counts={counts} />

      <VacancyFilters onFilter={setFilters} onClear={() => setFilters({ search: '', course: '', type: '', modality: '' })} />

      <VacancyTable vacancies={filteredVacancies} />
    </div>
  );
}
