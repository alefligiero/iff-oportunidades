import Link from 'next/link';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, InternshipStatus } from '@prisma/client';

const prisma = new PrismaClient();

const statusMap = {
  [InternshipStatus.IN_ANALYSIS]: { text: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
  [InternshipStatus.APPROVED]: { text: 'Aprovado', color: 'bg-blue-100 text-blue-800' },
  [InternshipStatus.IN_PROGRESS]: { text: 'Em Andamento', color: 'bg-green-100 text-green-800' },
  [InternshipStatus.FINISHED]: { text: 'Finalizado', color: 'bg-gray-100 text-gray-800' },
  [InternshipStatus.CANCELED]: { text: 'Cancelado', color: 'bg-red-100 text-red-800' },
};

async function getStudentInternships() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    return { data: [], error: 'Token não encontrado.' };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    
    const studentProfile = await prisma.student.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      return { data: [], error: 'Perfil de aluno não encontrado.' };
    }

    const internships = await prisma.internship.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    return { data: internships, error: null };

  } catch (error) {
    console.error("Erro ao buscar estágios no servidor:", error);
    return { data: [], error: 'Não foi possível carregar os seus estágios.' };
  }
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default async function MyInternshipsPage() {
  const { data: internships, error } = await getStudentInternships();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Meus Estágios</h1>
        <Link href="/dashboard/internships/new" className="button-primary px-4 py-2 text-sm">
          Formalizar Novo Estágio
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500">{error}</p>}
        {!error && internships.length === 0 && (
          <p className="text-gray-700">Você ainda não possui nenhum estágio registado.</p>
        )}
        {!error && internships.length > 0 && (
          <ul className="space-y-4">
            {internships.map((internship) => (
              <li key={internship.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-gray-900">{internship.companyName}</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(internship.startDate)} - {formatDate(internship.endDate)}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusMap[internship.status]?.color ?? 'bg-gray-100'}`}>
                  {statusMap[internship.status]?.text ?? 'Desconhecido'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
