'use client';

import { useState, useMemo } from 'react';
import { InternshipStatus, Course, InternshipType, InternshipModality } from '@prisma/client';
import InternshipTabs from './InternshipTabs';
import InternshipFilters, { FilterState } from './InternshipFilters';
import InternshipTable from './InternshipTable';

interface Internship {
  id: string;
  status: InternshipStatus;
  createdAt: string;
  student: { name: string; matricula: string };
  companyName: string;
  studentCourse: Course;
  type: InternshipType;
  modality: InternshipModality;
  startDate: string;
  endDate: string;
  earlyTerminationRequested: boolean;
}

interface InternshipsPageContentProps {
  allInternships: Internship[];
}

export default function InternshipsPageContent({ allInternships }: InternshipsPageContentProps) {
  const [activeStatus, setActiveStatus] = useState<InternshipStatus>(InternshipStatus.IN_ANALYSIS);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    course: '',
    type: '',
    modality: '',
  });

  // Contar estágios por status
  const counts = useMemo(() => {
    const result: { [key in InternshipStatus]: number } = {
      IN_ANALYSIS: 0,
      APPROVED: 0,
      IN_PROGRESS: 0,
      FINISHED: 0,
      CANCELED: 0,
    };

    allInternships.forEach((internship) => {
      result[internship.status]++;
    });

    return result;
  }, [allInternships]);

  // Filtrar estágios
  const filteredInternships = useMemo(() => {
    let result = allInternships.filter((internship) => internship.status === activeStatus);

    // Aplicar filtros
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (internship) =>
          internship.student.name.toLowerCase().includes(searchLower) ||
          internship.companyName.toLowerCase().includes(searchLower) ||
          internship.student.matricula.includes(filters.search)
      );
    }

    if (filters.course) {
      result = result.filter((internship) => internship.studentCourse === filters.course);
    }

    if (filters.type) {
      result = result.filter((internship) => internship.type === filters.type);
    }

    if (filters.modality) {
      result = result.filter((internship) => internship.modality === filters.modality);
    }

    // Ordenação por status
    if (activeStatus === InternshipStatus.IN_ANALYSIS) {
      // Pendentes: mais antigo primeiro
      result.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } else {
      // Outros: mais recente primeiro
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [allInternships, activeStatus, filters]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Estágios</h1>
        <p className="text-gray-600 text-sm mt-1">Visualize e gerencie todos os estágios</p>
      </div>

      <InternshipTabs
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        counts={counts}
      />

      <InternshipFilters
        onFilter={setFilters}
        onClear={() => setFilters({ search: '', course: '', type: '', modality: '' })}
      />

      <InternshipTable internships={filteredInternships} />
    </div>
  );
}
