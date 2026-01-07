'use client';

import Link from 'next/link';
import { InternshipStatus, Course, InternshipType, InternshipModality } from '@prisma/client';

const courseMap: { [key in Course]: string } = {
  BSI: 'Bacharelado em Sistemas de Informação',
  LIC_QUIMICA: 'Licenciatura em Química',
  ENG_MECANICA: 'Engenharia Mecânica',
  TEC_ADM_INTEGRADO: 'Técnico em Administração Integrado',
  TEC_ELETRO_INTEGRADO: 'Técnico em Eletrônica Integrado',
  TEC_INFO_INTEGRADO: 'Técnico em Informática Integrado',
  TEC_QUIMICA_INTEGRADO: 'Técnico em Química Integrado',
  TEC_AUTOMACAO_SUBSEQUENTE: 'Técnico em Automação Subsequente',
  TEC_ELETRO_CONCOMITANTE: 'Técnico em Eletrônica Concomitante',
  TEC_MECANICA_CONCOMITANTE: 'Técnico em Mecânica Concomitante',
  TEC_QUIMICA_CONCOMITANTE: 'Técnico em Química Concomitante',
};

const typeMap: { [key in InternshipType]: string } = {
  DIRECT: 'Estágio Direto',
  INTEGRATOR: 'Agente Integrador',
};

const modalityMap: { [key in InternshipModality]: string } = {
  PRESENCIAL: 'Presencial',
  REMOTO: 'Remoto',
};

const statusBadgeMap: { [key in InternshipStatus]: { text: string; color: string } } = {
  IN_ANALYSIS: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  APPROVED: { text: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  IN_PROGRESS: { text: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  FINISHED: { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  CANCELED: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

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

interface InternshipTableProps {
  internships: Internship[];
  loading?: boolean;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

export default function InternshipTable({ internships, loading = false }: InternshipTableProps) {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (internships.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600">Nenhum estágio encontrado com os filtros selecionados.</p>
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
                Aluno
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Curso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Período
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
            {internships.map((internship) => (
              <tr key={internship.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{internship.student.name}</div>
                  <div className="text-gray-500 text-xs">{internship.student.matricula}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {internship.companyName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {courseMap[internship.studentCourse]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {typeMap[internship.type]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(internship.startDate)} - {formatDate(internship.endDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        statusBadgeMap[internship.status].color
                      }`}
                    >
                      {statusBadgeMap[internship.status].text}
                    </span>
                    {internship.earlyTerminationRequested && (
                      <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold" title="Encerramento antecipado solicitado">
                        ⚠️
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/dashboard/admin/internships/${internship.id}`}
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
