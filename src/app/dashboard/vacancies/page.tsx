import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, VacancyStatus, VacancyType, Prisma } from '@prisma/client';
import VacancyFilters from '@/app/dashboard/vacancies/VacancyFilters';
import CloseVacancyButton from '@/app/dashboard/vacancies/CloseVacancyButton';

const prisma = new PrismaClient();

const statusMap = {
  [VacancyStatus.PENDING_APPROVAL]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  [VacancyStatus.APPROVED]: { text: 'Aprovada', color: 'bg-green-100 text-green-800' },
  [VacancyStatus.REJECTED]: { text: 'Rejeitada', color: 'bg-red-100 text-red-800' },
  [VacancyStatus.CLOSED_BY_COMPANY]: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
};

type VacanciesParams = {
  searchParams: Promise<{
    search?: string;
    type?: string;
    modality?: string;
    course?: string;
    minSalary?: string;
    maxSalary?: string;
    minWorkload?: string;
    maxWorkload?: string;
    sort?: string;
  }>;
};

async function getVacancies(searchParams: Awaited<VacanciesParams['searchParams']>) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    return { data: [], error: 'Token não encontrado.', role: null };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const userRole = payload.role as Role;

    if (userRole === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({ where: { userId } });
      if (!companyProfile) return { data: [], error: 'Perfil de empresa não encontrado.', role: userRole };
      
      const vacancies = await prisma.jobVacancy.findMany({
        where: { companyId: companyProfile.id },
        orderBy: { createdAt: 'desc' },
      });
      return { data: vacancies, error: null, role: userRole };
    }

    if (userRole === 'STUDENT') {
      // Build where clause for filters
      const where: Prisma.JobVacancyWhereInput = {
        status: 'APPROVED',
      };

      // Text search (title or description)
      if (searchParams.search) {
        where.OR = [
          { title: { contains: searchParams.search, mode: 'insensitive' } },
          { description: { contains: searchParams.search, mode: 'insensitive' } },
        ];
      }

      // Type filter (INTERNSHIP or JOB)
      if (searchParams.type && (searchParams.type === 'INTERNSHIP' || searchParams.type === 'JOB')) {
        where.type = searchParams.type as VacancyType;
      }

      // Modality filter (PRESENCIAL, HIBRIDO, REMOTO)
      if (searchParams.modality && ['PRESENCIAL', 'HIBRIDO', 'REMOTO'].includes(searchParams.modality)) {
        where.modality = searchParams.modality as any;
      }

      // Course filter (check if vacancy has this course in eligibleCourses array)
      if (searchParams.course) {
        where.eligibleCourses = {
          has: searchParams.course as any,
        };
      }

      // Salary range filter
      if (searchParams.minSalary || searchParams.maxSalary) {
        where.remuneration = {};
        if (searchParams.minSalary) {
          where.remuneration.gte = parseFloat(searchParams.minSalary);
        }
        if (searchParams.maxSalary) {
          where.remuneration.lte = parseFloat(searchParams.maxSalary);
        }
      }

      // Workload range filter (hours per week)
      if (searchParams.minWorkload || searchParams.maxWorkload) {
        where.workload = {} as any;
        if (searchParams.minWorkload) {
          const v = parseInt(searchParams.minWorkload, 10);
          if (!Number.isNaN(v)) (where.workload as any).gte = v;
        }
        if (searchParams.maxWorkload) {
          const v = parseInt(searchParams.maxWorkload, 10);
          if (!Number.isNaN(v)) (where.workload as any).lte = v;
        }
      }

      // Sorting
      let orderBy: Prisma.JobVacancyOrderByWithRelationInput = { createdAt: 'desc' };
      if (searchParams.sort === 'salary_desc') {
        orderBy = { remuneration: 'desc' };
      } else if (searchParams.sort === 'salary_asc') {
        orderBy = { remuneration: 'asc' };
      } else if (searchParams.sort === 'workload_asc') {
        orderBy = { workload: 'asc' };
      } else if (searchParams.sort === 'workload_desc') {
        orderBy = { workload: 'desc' };
      } else if (searchParams.sort === 'title_asc') {
        orderBy = { title: 'asc' };
      }

      const vacancies = await prisma.jobVacancy.findMany({
        where,
        include: { company: { select: { name: true } } },
        orderBy,
      });
      return { data: vacancies, error: null, role: userRole };
    }

    return { data: [], error: 'Perfil não autorizado.', role: userRole };

  } catch (error) {
    console.error("Erro ao buscar vagas:", error);
    return { data: [], error: 'Não foi possível carregar as vagas.', role: null };
  }
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default async function MyVacanciesPage({ searchParams }: VacanciesParams) {
  const params = await searchParams;
  const { data: vacancies, error, role } = await getVacancies(params);

  const isCompany = role === 'COMPANY';

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          {isCompany ? 'Minhas Vagas Publicadas' : 'Vagas Disponíveis'}
        </h1>
        {isCompany && (
          <Link href="/dashboard/vacancies/new" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
            Publicar Nova Vaga
          </Link>
        )}
      </div>

      {/* Filtros - apenas para estudantes */}
      {!isCompany && <VacancyFilters />}

      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500">{error}</p>}
        {!error && vacancies.length === 0 && (
          <p className="text-gray-700">{isCompany ? 'Você ainda não publicou nenhuma vaga.' : 'Nenhuma vaga disponível no momento.'}</p>
        )}
        {!error && vacancies.length > 0 && (
          <div className="space-y-6">
            {vacancies.map((vacancy) => {
              const companyName = 'company' in vacancy ? vacancy.company.name : '';
              return (
                <div key={vacancy.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-lg">{vacancy.title}</p>
                      <p className="text-sm text-gray-600">
                        {isCompany ? `Publicada em: ${formatDate(vacancy.createdAt)}` : `Empresa: ${companyName}`}
                      </p>
                    </div>
                    {isCompany && (
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusMap[vacancy.status as VacancyStatus]?.color ?? 'bg-gray-100'}`}>
                        {statusMap[vacancy.status as VacancyStatus]?.text ?? 'Desconhecido'}
                      </span>
                    )}
                  </div>

                  {/* Informações da vaga para estudantes */}
                  {!isCompany && (
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
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
                  )}

                  <p className="text-sm text-gray-800 mt-2 mb-3 line-clamp-2">{vacancy.description}</p>
                  <div className="flex gap-3 items-center">
                    <Link href={`/dashboard/vacancies/${vacancy.id}`} className="inline-block text-sm font-medium text-green-700 hover:text-green-900">
                      Ver Detalhes →
                    </Link>
                    {isCompany && (
                      <CloseVacancyButton 
                        vacancyId={vacancy.id} 
                        vacancyTitle={vacancy.title}
                        status={vacancy.status}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

