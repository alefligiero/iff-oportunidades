'use client';

import { Course, InternshipType, InternshipModality } from '@prisma/client';
import { useState } from 'react';

interface InternshipFiltersProps {
  onFilter: (filters: FilterState) => void;
  onClear: () => void;
}

export interface FilterState {
  search: string;
  course: Course | '';
  type: InternshipType | '';
  modality: InternshipModality | '';
}

const courseOptions: { value: Course; label: string }[] = [
  { value: 'BSI', label: 'Bacharelado em Sistemas de Informação' },
  { value: 'LIC_QUIMICA', label: 'Licenciatura em Química' },
  { value: 'ENG_MECANICA', label: 'Engenharia Mecânica' },
  { value: 'TEC_ADM_INTEGRADO', label: 'Técnico em Administração Integrado' },
  { value: 'TEC_ELETRO_INTEGRADO', label: 'Técnico em Eletrônica Integrado' },
  { value: 'TEC_INFO_INTEGRADO', label: 'Técnico em Informática Integrado' },
  { value: 'TEC_QUIMICA_INTEGRADO', label: 'Técnico em Química Integrado' },
  { value: 'TEC_AUTOMACAO_SUBSEQUENTE', label: 'Técnico em Automação Subsequente' },
  { value: 'TEC_ELETRO_CONCOMITANTE', label: 'Técnico em Eletrônica Concomitante' },
  { value: 'TEC_MECANICA_CONCOMITANTE', label: 'Técnico em Mecânica Concomitante' },
  { value: 'TEC_QUIMICA_CONCOMITANTE', label: 'Técnico em Química Concomitante' },
];

export default function InternshipFilters({ onFilter, onClear }: InternshipFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    course: '',
    type: '',
    modality: '',
  });

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const handleClear = () => {
    const emptyFilters: FilterState = { search: '', course: '', type: '', modality: '' };
    setFilters(emptyFilters);
    onClear();
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Busca por aluno/empresa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Buscar (Aluno/Empresa)
          </label>
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Nome do aluno ou empresa"
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Curso */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
          <select
            value={filters.course}
            onChange={(e) => handleFilterChange('course', e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {courseOptions.map((course) => (
              <option key={course.value} value={course.value}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de estágio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="DIRECT">Estágio Direto</option>
            <option value="INTEGRATOR">Agente Integrador</option>
          </select>
        </div>

        {/* Modalidade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
          <select
            value={filters.modality}
            onChange={(e) => handleFilterChange('modality', e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="" className="text-gray-500">Todos</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="REMOTO">Remoto</option>
          </select>
        </div>

        {/* Botão Limpar */}
        <div className="flex items-end">
          <button
            onClick={handleClear}
            disabled={!hasActiveFilters}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Limpar Filtros
          </button>
        </div>
      </div>
    </div>
  );
}
