import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, VacancyStatus } from '@prisma/client';

const prisma = new PrismaClient();

const statusMap = {
  [VacancyStatus.PENDING_APPROVAL]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  [VacancyStatus.APPROVED]: { text: 'Aprovada', color: 'bg-green-100 text-green-800' },
  [VacancyStatus.REJECTED]: { text: 'Rejeitada', color: 'bg-red-100 text-red-800' },
  [VacancyStatus.CLOSED_BY_COMPANY]: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
};

async function getVacancies() {
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
      const vacancies = await prisma.jobVacancy.findMany({
        where: { status: 'APPROVED' },
        include: { company: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
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

export default async function MyVacanciesPage() {
  const { data: vacancies, error, role } = await getVacancies();

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

      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500">{error}</p>}
        {!error && vacancies.length === 0 && (
          <p className="text-gray-700">{isCompany ? 'Você ainda não publicou nenhuma vaga.' : 'Nenhuma vaga disponível no momento.'}</p>
        )}
        {!error && vacancies.length > 0 && (
          <ul className="space-y-6">
            {vacancies.map((vacancy : any) => (
              <li key={vacancy.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{vacancy.title}</p>
                    <p className="text-sm text-gray-600">
                      {isCompany ? `Publicada em: ${formatDate(vacancy.createdAt)}` : `Empresa: ${vacancy.company.name}`}
                    </p>
                  </div>
                  {isCompany && (
                     <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusMap[vacancy.status]?.color ?? 'bg-gray-100'}`}>
                       {statusMap[vacancy.status]?.text ?? 'Desconhecido'}
                     </span>
                  )}
                </div>
                 <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">{vacancy.description.substring(0, 150)}...</p>
                 <Link href={`/dashboard/vacancies/${vacancy.id}`} className="inline-block mt-3 text-sm font-medium text-green-700 hover:text-green-900">
                    Ver Detalhes
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

