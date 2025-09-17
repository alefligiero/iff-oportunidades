import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, Role, VacancyStatus } from '@prisma/client';

const prisma = new PrismaClient();

const statusMap = {
  [VacancyStatus.PENDING_APPROVAL]: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  [VacancyStatus.APPROVED]: { text: 'Aprovada', color: 'bg-green-100 text-green-800' },
  [VacancyStatus.REJECTED]: { text: 'Rejeitada', color: 'bg-red-100 text-red-800' },
  [VacancyStatus.CLOSED_BY_COMPANY]: { text: 'Fechada', color: 'bg-gray-100 text-gray-800' },
};

async function getPendingVacancies() {
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

    const vacancies = await prisma.jobVacancy.findMany({
      where: {
        status: VacancyStatus.PENDING_APPROVAL,
      },
      include: {
        company: { 
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', 
      },
    });

    return vacancies;

  } catch (error) {
    console.error("Erro ao buscar vagas pendentes:", error);
    redirect('/'); 
  }
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default async function PendingVacanciesPage() {
  const pendingVacancies = await getPendingVacancies();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Vagas Pendentes de Aprovação</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {pendingVacancies.length === 0 ? (
          <p className="text-gray-700">Não há nenhuma vaga pendente de aprovação no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título da Vaga</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Submissão</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingVacancies.map((vacancy) => (
                  <tr key={vacancy.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vacancy.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vacancy.company.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(vacancy.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[vacancy.status]?.color}`}>
                        {statusMap[vacancy.status]?.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {/* TODO: Criar a página de detalhes da vaga para o admin */}
                      <Link href={`/dashboard/admin/vacancies/${vacancy.id}`} className="text-green-600 hover:text-green-900">
                        Analisar Vaga
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
