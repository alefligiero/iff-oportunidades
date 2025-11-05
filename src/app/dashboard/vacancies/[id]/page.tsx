import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, Course } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

// Mapeamento de cursos para exibição
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

type VacancyDetailsParams = {
  params: Promise<{ id: string }>;
};

async function getVacancyDetails(vacancyId: string) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    return { vacancy: null, error: 'Token não encontrado.', userRole: null, isOwner: false };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const userRole = payload.role as Role;

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
      return { vacancy: null, error: 'Vaga não encontrada.', userRole, isOwner: false };
    }

    // Verifica se é o dono da vaga (para empresas)
    let isOwner = false;
    if (userRole === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({ where: { userId } });
      isOwner = companyProfile?.id === vacancy.companyId;
    }

    // Estudantes só podem ver vagas aprovadas (a não ser que seja admin)
    if (userRole === 'STUDENT' && vacancy.status !== 'APPROVED') {
      return { vacancy: null, error: 'Vaga não disponível.', userRole, isOwner: false };
    }

    return { vacancy, error: null, userRole, isOwner };
  } catch (error) {
    console.error('Erro ao buscar detalhes da vaga:', error);
    return { vacancy: null, error: 'Erro ao carregar detalhes.', userRole: null, isOwner: false };
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

// Função para formatar texto com quebras de linha em lista
const formatTextList = (text: string) => {
  if (!text) return null;
  
  const lines = text.split('\n').filter(line => line.trim());
  return (
    <ul className="list-disc list-inside space-y-1">
      {lines.map((line, index) => {
        // Remove hífen inicial se existir
        const cleanLine = line.trim().replace(/^-\s*/, '');
        return cleanLine ? <li key={index}>{cleanLine}</li> : null;
      })}
    </ul>
  );
};

export default async function VacancyDetailsPage({ params }: VacancyDetailsParams) {
  const { id } = await params;
  const { vacancy, error, userRole, isOwner } = await getVacancyDetails(id);

  if (error || !vacancy) {
    notFound();
  }

  const isStudent = userRole === 'STUDENT';

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/vacancies"
          className="text-sm text-green-700 hover:text-green-900 font-medium mb-3 inline-block"
        >
          ← Voltar para vagas
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{vacancy.title}</h1>
        <div className="flex items-center gap-4 text-gray-600">
          <span className="font-medium">{vacancy.company.name}</span>
          <span>•</span>
          <span>{vacancy.type === 'INTERNSHIP' ? '🎓 Estágio' : '💼 Emprego'}</span>
          <span>•</span>
          <span>{modalityLabels[vacancy.modality]}</span>
        </div>
      </div>

      {/* Card Principal */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Informações Principais */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Remuneração</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatCurrency(vacancy.remuneration)}
              </p>
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
                <span
                  key={course}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  {courseLabels[course as Course]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Responsabilidades */}
        {vacancy.responsibilities && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Responsabilidades e Atividades
            </h2>
            <div className="text-gray-700">{formatTextList(vacancy.responsibilities)}</div>
          </div>
        )}

        {/* Conhecimentos Técnicos */}
        {vacancy.technicalSkills && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Conhecimentos Técnicos Necessários
            </h2>
            <div className="text-gray-700">{formatTextList(vacancy.technicalSkills)}</div>
          </div>
        )}

        {/* Habilidades Comportamentais */}
        {vacancy.softSkills && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              Habilidades Comportamentais
            </h2>
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
        {(vacancy.company.location || vacancy.company.description) && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Sobre a Empresa</h2>
            {vacancy.company.description && (
              <p className="text-gray-700 mb-3 whitespace-pre-line">
                {vacancy.company.description}
              </p>
            )}
            {vacancy.company.location && (
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">📍 Localização:</span>
                <span>{vacancy.company.location}</span>
              </div>
            )}
          </div>
        )}

        {/* Contato */}
        {vacancy.contactInfo && (
          <div className="p-6 bg-green-50">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Como se Candidatar</h2>
            <div className="text-gray-700 whitespace-pre-line">
              {vacancy.contactInfo}
            </div>
          </div>
        )}

        {/* Informações Adicionais (rodapé) */}
        <div className="p-6 bg-gray-50 text-sm text-gray-600">
          <div className="flex flex-wrap gap-4">
            <span>Publicada em: {formatDate(vacancy.createdAt)}</span>
            {isOwner && (
              <>
                <span>•</span>
                <span>
                  Status:{' '}
                  <span className="font-medium">
                    {vacancy.status === 'APPROVED'
                      ? 'Aprovada'
                      : vacancy.status === 'PENDING_APPROVAL'
                      ? 'Pendente'
                      : vacancy.status === 'REJECTED'
                      ? 'Rejeitada'
                      : 'Fechada'}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Botão de ação */}
      {isStudent && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
          <p className="text-sm text-gray-600 mb-4">
            💡 Interessado nesta vaga? Entre em contato com a empresa através das informações de
            contato fornecidas acima.
          </p>
        </div>
      )}
    </div>
  );
}
