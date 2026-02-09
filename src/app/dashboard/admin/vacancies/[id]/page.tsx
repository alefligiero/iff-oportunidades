import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, Course } from '@prisma/client';
import ActionButtons from './ActionButtons';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const courseLabels: Partial<Record<Course, string>> = {
  BSI: 'Bacharelado em Sistemas de Informação',
  LIC_QUIMICA: 'Licenciatura em Química',
  ENG_MECANICA: 'Engenharia Mecânica',
  TEC_ADM_INTEGRADO: 'Técnico em Administração (Integrado)',
  TEC_ELETRO_INTEGRADO: 'Técnico em Eletrotécnica (Integrado)',
  TEC_INFO_INTEGRADO: 'Técnico em Informática (Integrado)',
  TEC_QUIMICA_INTEGRADO: 'Técnico em Química (Integrado)',
  TEC_AUTOMACAO_SUBSEQUENTE: 'Técnico em Automação Industrial (Subsequente)',
  TEC_ELETRO_CONCOMITANTE: 'Técnico em Eletrotécnica (Concomitante)',
  TEC_MECANICA_CONCOMITANTE: 'Técnico em Mecânica (Concomitante)',
  TEC_QUIMICA_CONCOMITANTE: 'Técnico em Química (Concomitante)',
};

const modalityLabels = {
  PRESENCIAL: 'Presencial',
  HIBRIDO: 'Híbrido',
  REMOTO: 'Remoto',
};

const typeLabels = {
  INTERNSHIP: 'Estágio',
  JOB: 'Emprego',
};

const statusLabels = {
  PENDING_APPROVAL: 'Pendente de Aprovação',
  APPROVED: 'Aprovada',
  REJECTED: 'Rejeitada',
  CLOSED_BY_COMPANY: 'Fechada pela Empresa',
  CLOSED_BY_ADMIN: 'Fechada pelo Admin',
};

async function getVacancyDetails(vacancyId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== Role.ADMIN) {
      redirect('/dashboard');
    }

    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: vacancyId },
      include: {
        company: {
          select: {
            name: true,
            cnpj: true,
            location: true,
            description: true,
          },
        },
      },
    });

    if (!vacancy) {
      return null;
    }

    return vacancy;
  } catch (error) {
    console.error('Erro ao buscar detalhes da vaga:', error);
    redirect('/dashboard/admin/vacancies');
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatTextList = (text: string) => {
  if (!text) return null;

  const lines = text.split('\n').filter((line) => line.trim());
  return (
    <ul className="list-disc list-inside space-y-1">
      {lines.map((line, index) => {
        const cleanLine = line.trim().replace(/^-\s*/, '');
        return cleanLine ? <li key={index}>{cleanLine}</li> : null;
      })}
    </ul>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PENDING_APPROVAL':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'CLOSED_BY_COMPANY':
      return 'bg-gray-100 text-gray-800';
    case 'CLOSED_BY_ADMIN':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default async function VacancyDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancy = await getVacancyDetails(id);

  if (!vacancy) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Vaga não encontrada</h1>
        <p className="mt-2">A vaga que você está tentando visualizar não existe ou foi removida.</p>
        <Link href="/dashboard/admin/vacancies" className="mt-4 text-blue-600 hover:text-blue-800">
          ← Voltar para vagas
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link href="/dashboard/admin/vacancies" className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-3 inline-block">
            ← Voltar para vagas
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{vacancy.title}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="font-medium">{vacancy.company.name}</span>
            <span>•</span>
            <span>{typeLabels[vacancy.type]}</span>
            <span>•</span>
            <span>{modalityLabels[vacancy.modality]}</span>
          </div>
        </div>
        <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(vacancy.status)}`}>
          {statusLabels[vacancy.status]}
        </span>
      </div>

      {/* Ações de Moderação */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <ActionButtons vacancyId={vacancy.id} status={vacancy.status} />
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {vacancy.status === 'REJECTED' && vacancy.rejectionReason && (
          <div className="p-6 border-b border-gray-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Motivo da Rejeicao</h2>
            <p className="text-red-800 whitespace-pre-line">{vacancy.rejectionReason}</p>
          </div>
        )}

        {(vacancy.status === 'CLOSED_BY_ADMIN' || vacancy.status === 'CLOSED_BY_COMPANY') && vacancy.closureReason && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Observacao de Fechamento</h2>
            <p className="text-gray-700 whitespace-pre-line">{vacancy.closureReason}</p>
          </div>
        )}

        {/* Informações Principais */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Remuneração</p>
              <p className="text-lg font-semibold text-gray-900">{formatCurrency(vacancy.remuneration)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Carga Horária</p>
              <p className="text-lg font-semibold text-gray-900">{vacancy.workload}h/semana</p>
            </div>
            {vacancy.type === 'INTERNSHIP' && vacancy.minPeriod && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Período Mínimo</p>
                <p className="text-lg font-semibold text-gray-900">{vacancy.minPeriod}º período</p>
              </div>
            )}
          </div>
        </div>

        {/* Descrição Geral */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre a Vaga</h2>
          <p className="text-gray-700 whitespace-pre-line">{vacancy.description}</p>
        </div>

        {/* Cursos Elegíveis */}
        {vacancy.eligibleCourses && vacancy.eligibleCourses.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Cursos Elegíveis</h2>
            <div className="flex flex-wrap gap-2">
              {vacancy.eligibleCourses.map((course) => (
                <span key={course} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {courseLabels[course as Course]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Responsabilidades */}
        {vacancy.responsibilities && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsabilidades e Atividades</h2>
            <div className="text-gray-700">{formatTextList(vacancy.responsibilities)}</div>
          </div>
        )}

        {/* Conhecimentos Técnicos */}
        {vacancy.technicalSkills && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Conhecimentos Técnicos Necessários</h2>
            <div className="text-gray-700">{formatTextList(vacancy.technicalSkills)}</div>
          </div>
        )}

        {/* Habilidades Comportamentais */}
        {vacancy.softSkills && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Habilidades Comportamentais</h2>
            <div className="text-gray-700">{formatTextList(vacancy.softSkills)}</div>
          </div>
        )}

        {/* Benefícios */}
        {vacancy.benefits && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Benefícios Adicionais</h2>
            <div className="text-gray-700">{formatTextList(vacancy.benefits)}</div>
          </div>
        )}

        {/* Informações da Empresa */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Informações da Empresa</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Nome</p>
              <p className="font-medium text-gray-900">{vacancy.company.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">CNPJ</p>
              <p className="font-medium text-gray-900">{vacancy.company.cnpj}</p>
            </div>
            {vacancy.company.location && (
              <div>
                <p className="text-sm text-gray-600">Localização</p>
                <p className="font-medium text-gray-900">{vacancy.company.location}</p>
              </div>
            )}
            {vacancy.company.description && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Descrição</p>
                <p className="text-gray-700 whitespace-pre-line">{vacancy.company.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Contato */}
        {vacancy.contactInfo && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Como se Candidatar</h2>
            <div className="text-gray-700 whitespace-pre-line">{vacancy.contactInfo}</div>
          </div>
        )}

        {/* Informações Adicionais (rodapé) */}
        <div className="p-6 bg-gray-50 text-sm text-gray-600">
          <div className="space-y-1">
            <span>Publicada em: {formatDate(vacancy.createdAt)} </span>
            <span>Última atualização: {formatDate(vacancy.updatedAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
