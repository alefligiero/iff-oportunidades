import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, VacancyStatus } from '@prisma/client';

const prisma = new PrismaClient();

const vacancyStatusMap = {
  [VacancyStatus.PENDING_APPROVAL]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  [VacancyStatus.APPROVED]: { text: 'Aprovada', color: 'bg-green-100 text-green-800' },
  [VacancyStatus.REJECTED]: { text: 'Recusada', color: 'bg-red-100 text-red-800' },
  [VacancyStatus.CLOSED_BY_COMPANY]: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
};

async function getCompanyVacancies(userId: string) {
  const companyProfile = await prisma.company.findUnique({ where: { userId } });
  if (!companyProfile) return [];

  return prisma.jobVacancy.findMany({
    where: { companyId: companyProfile.id },
    orderBy: { createdAt: 'desc' },
  });
}

async function getApprovedVacancies() {
  return prisma.jobVacancy.findMany({
    where: { status: VacancyStatus.APPROVED },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}


export default async function VacanciesPage() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) redirect('/');

  let session;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    session = payload;
  } catch {
    redirect('/');
  }

  const isCompany = session.role === Role.COMPANY;
  const isStudent = session.role === Role.STUDENT;

  const vacancies = isCompany 
    ? await getCompanyVacancies(session.userId as string)
    : await getApprovedVacancies();

  if (isCompany) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Minhas Vagas</h1>
          <Link href="/dashboard/vacancies/new" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
            Publicar Nova Vaga
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {vacancies.length === 0 ? (
            <p className="text-gray-700 text-center py-8">Você ainda não publicou nenhuma vaga.</p>
          ) : (
            <ul className="space-y-4">
              {vacancies.map((vacancy) => (
                <li key={vacancy.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900">{vacancy.title}</p>
                    <p className="text-sm text-gray-600 capitalize">{vacancy.type.toLowerCase()}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${vacancyStatusMap[vacancy.status]?.color}`}>
                    {vacancyStatusMap[vacancy.status]?.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }
  
  if (isStudent) {
     return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Vagas Disponíveis</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {vacancies.length === 0 ? (
            <p className="text-gray-700 text-center py-8">Não há vagas disponíveis no momento.</p>
          ) : (
            <ul className="space-y-4">
              {vacancies.map((vacancy) => (
                <li key={vacancy.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <p className="font-semibold text-gray-900">{vacancy.title}</p>
                  <p className="text-sm text-gray-600">
                    {(vacancy as any).company.name} - <span className="capitalize">{vacancy.type.toLowerCase()}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{vacancy.description}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  }

  return redirect('/dashboard');
}
