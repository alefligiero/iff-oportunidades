import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, InternshipStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();

const statusMap = {
  [InternshipStatus.IN_ANALYSIS]: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
};

async function getPendingInternships() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== Role.ADMIN) {
      redirect('/dashboard');
    }

    const internships = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.IN_ANALYSIS,
      },
      include: {
        student: { 
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', 
      },
    });

    return internships;

  } catch (error) {
    console.error("Erro ao buscar estágios pendentes:", error);
    redirect('/'); 
  }
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default async function PendingInternshipsPage() {
  const pendingInternships = await getPendingInternships();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Estágios Pendentes de Análise</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {pendingInternships.length === 0 ? (
          <p className="text-gray-700">Não há nenhum estágio pendente de análise no momento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aluno</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Submissão</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingInternships.map((internship) => (
                  <tr key={internship.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{internship.student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{internship.companyName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(internship.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusMap[internship.status]?.color}`}>
                        {statusMap[internship.status]?.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link href={`/dashboard/admin/internships/${internship.id}`} className="text-green-600 hover:text-green-900">
                        Ver Detalhes
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
