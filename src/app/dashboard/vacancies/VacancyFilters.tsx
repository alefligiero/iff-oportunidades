'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Course } from '@prisma/client';

const sortLabels: Record<string, string> = {
  createdAt_desc: 'Mais recentes',
  salary_desc: 'Maior remuneração',
  salary_asc: 'Menor remuneração',
  workload_asc: 'Menor carga horária',
  workload_desc: 'Maior carga horária',
  title_asc: 'Título (A-Z)'
};

const courseLabels: Record<Course, string> = {
  BSI: 'BSI',
  LIC_QUIMICA: 'Lic. Química',
  ENG_MECANICA: 'Eng. Mecânica',
  TEC_ADM_INTEGRADO: 'Téc. Adm.',
  TEC_ELETRO_INTEGRADO: 'Téc. Eletro.',
  TEC_INFO_INTEGRADO: 'Téc. Info.',
  TEC_QUIMICA_INTEGRADO: 'Téc. Química',
  TEC_AUTOMACAO_SUBSEQUENTE: 'Téc. Automação',
  TEC_ELETRO_CONCOMITANTE: 'Téc. Eletro. (Conc.)',
  TEC_MECANICA_CONCOMITANTE: 'Téc. Mecânica (Conc.)',
  TEC_QUIMICA_CONCOMITANTE: 'Téc. Química (Conc.)',
};

const modalityLabels: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
};

export default function VacancyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estados dos filtros
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [modality, setModality] = useState(searchParams.get('modality') || '');
  const [course, setCourse] = useState(searchParams.get('course') || '');
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '');
  const [maxSalary, setMaxSalary] = useState(searchParams.get('maxSalary') || '');
  const [minWorkload, setMinWorkload] = useState(searchParams.get('minWorkload') || '');
  const [maxWorkload, setMaxWorkload] = useState(searchParams.get('maxWorkload') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'createdAt_desc');

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar com URL params quando a página carrega/atualiza
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setType(searchParams.get('type') || '');
    setModality(searchParams.get('modality') || '');
    setCourse(searchParams.get('course') || '');
    setMinSalary(searchParams.get('minSalary') || '');
    setMaxSalary(searchParams.get('maxSalary') || '');
    setMinWorkload(searchParams.get('minWorkload') || '');
    setMaxWorkload(searchParams.get('maxWorkload') || '');
    setSort(searchParams.get('sort') || 'createdAt_desc');
  }, [searchParams]);

  const navigateWithParams = (updater: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    updater(params);
    const query = params.toString();
    router.replace(query ? `/dashboard/vacancies?${query}` : '/dashboard/vacancies');
  };

  // Atualização imediata por campo
  const onSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigateWithParams((p) => {
        if (value) p.set('search', value); else p.delete('search');
      });
    }, 350);
  };

  const onTypeChange = (value: string) => {
    setType(value);
    navigateWithParams((p) => {
      if (value) p.set('type', value); else p.delete('type');
    });
  };

  const onModalityChange = (value: string) => {
    setModality(value);
    navigateWithParams((p) => {
      if (value) p.set('modality', value); else p.delete('modality');
    });
  };

  const onCourseChange = (value: string) => {
    setCourse(value);
    navigateWithParams((p) => {
      if (value) p.set('course', value); else p.delete('course');
    });
  };

  const onMinSalaryChange = (value: string) => {
    setMinSalary(value);
    navigateWithParams((p) => {
      if (value) p.set('minSalary', value); else p.delete('minSalary');
    });
  };

  const onMaxSalaryChange = (value: string) => {
    setMaxSalary(value);
    navigateWithParams((p) => {
      if (value) p.set('maxSalary', value); else p.delete('maxSalary');
    });
  };

  const onMinWorkloadChange = (value: string) => {
    setMinWorkload(value);
    navigateWithParams((p) => {
      if (value) p.set('minWorkload', value); else p.delete('minWorkload');
    });
  };

  const onMaxWorkloadChange = (value: string) => {
    setMaxWorkload(value);
    navigateWithParams((p) => {
      if (value) p.set('maxWorkload', value); else p.delete('maxWorkload');
    });
  };

  const onSortChange = (value: string) => {
    setSort(value);
    navigateWithParams((p) => {
      if (value && value !== 'createdAt_desc') p.set('sort', value); else p.delete('sort');
    });
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
    setModality('');
    setCourse('');
    setMinSalary('');
    setMaxSalary('');
    setMinWorkload('');
    setMaxWorkload('');
    setSort('createdAt_desc');
    router.replace('/dashboard/vacancies');
  };

  const hasActiveFilters = Boolean(
    search || type || modality || course || minSalary || maxSalary || minWorkload || maxWorkload || (sort && sort !== 'createdAt_desc')
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtrar Vagas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Campo de Busca */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Buscar por título ou descrição
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ex: desenvolvedor, estágio..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        {/* Tipo de Vaga */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Vaga
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${type ? 'text-gray-900' : 'text-gray-700'}`}
          >
            <option value="">Todos os tipos</option>
            <option value="INTERNSHIP">🎓 Estágio</option>
            <option value="JOB">💼 Emprego</option>
          </select>
        </div>

        {/* Modalidade */}
        <div>
          <label htmlFor="modality" className="block text-sm font-medium text-gray-700 mb-1">
            Modalidade
          </label>
          <select
            id="modality"
            value={modality}
            onChange={(e) => onModalityChange(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${modality ? 'text-gray-900' : 'text-gray-700'}`}
          >
            <option value="">Todas as modalidades</option>
            <option value="PRESENCIAL">Presencial</option>
            <option value="HIBRIDO">Híbrido</option>
            <option value="REMOTO">Remoto</option>
          </select>
        </div>

        {/* Curso */}
        <div>
          <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
            Curso
          </label>
          <select
            id="course"
            value={course}
            onChange={(e) => onCourseChange(e.target.value)}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${course ? 'text-gray-900' : 'text-gray-700'}`}
          >
            <option value="">Todos os cursos</option>
            {Object.entries(courseLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {/* Salário Mínimo */}
        <div>
          <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700 mb-1">
            Remuneração Mínima (R$)
          </label>
          <input
            type="number"
            id="minSalary"
            value={minSalary}
            onChange={(e) => onMinSalaryChange(e.target.value)}
            placeholder="Ex: 800"
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        {/* Salário Máximo */}
        <div>
          <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700 mb-1">
            Remuneração Máxima (R$)
          </label>
          <input
            type="number"
            id="maxSalary"
            value={maxSalary}
            onChange={(e) => onMaxSalaryChange(e.target.value)}
            placeholder="Ex: 3000"
            min="0"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        {/* Carga horária mínima */}
        <div>
          <label htmlFor="minWorkload" className="block text-sm font-medium text-gray-700 mb-1">
            Carga horária mínima (h/semana)
          </label>
          <input
            type="number"
            id="minWorkload"
            value={minWorkload}
            onChange={(e) => onMinWorkloadChange(e.target.value)}
            placeholder="Ex: 10"
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        {/* Carga horária máxima */}
        <div>
          <label htmlFor="maxWorkload" className="block text-sm font-medium text-gray-700 mb-1">
            Carga horária máxima (h/semana)
          </label>
          <input
            type="number"
            id="maxWorkload"
            value={maxWorkload}
            onChange={(e) => onMaxWorkloadChange(e.target.value)}
            placeholder="Ex: 30"
            min="0"
            step="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          />
        </div>

        {/* Ordenação */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Ordenar por
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
          >
            <option value="createdAt_desc">Mais recentes</option>
            <option value="salary_desc">Maior remuneração</option>
            <option value="salary_asc">Menor remuneração</option>
            <option value="workload_asc">Menor carga horária</option>
            <option value="workload_desc">Maior carga horária</option>
            <option value="title_asc">Título (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap gap-3">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors font-medium"
          >
            ✕ Limpar Filtros
          </button>
        )}
      </div>

      {/* Indicador de Filtros Ativos */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Filtros ativos:</span>
            {search && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Busca: &quot;{search}&quot;</span>}
            {type && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{type === 'INTERNSHIP' ? 'Estágio' : 'Emprego'}</span>}
            {modality && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{modalityLabels[modality]}</span>}
            {course && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{courseLabels[course as Course]}</span>}
            {minSalary && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Min: R$ {minSalary}</span>}
            {maxSalary && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Max: R$ {maxSalary}</span>}
            {minWorkload && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Min: {minWorkload}h/sem</span>}
            {maxWorkload && <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Max: {maxWorkload}h/sem</span>}
            {sort && sort !== 'createdAt_desc' && (
              <span className="ml-2 inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                Ordenação: {sortLabels[sort] || sort}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
