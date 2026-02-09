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
  [InternshipStatus.REJECTED]: { text: 'Recusado', color: 'bg-red-100 text-red-800' },
  [InternshipStatus.CANCELED]: { text: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

async function getStudentInternships() {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth_token')?.value;

  if (!token) {
    return { data: [], hasActiveInternship: false, error: 'Token não encontrado.' };
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    
    const studentProfile = await prisma.student.findUnique({
      where: { userId },
    });

    if (!studentProfile) {
      return { data: [], hasActiveInternship: false, error: 'Perfil de aluno não encontrado.' };
    }

    const internships = await prisma.internship.findMany({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    const hasActiveInternship = internships.some(i => i.status === InternshipStatus.IN_PROGRESS);

    return { data: internships, hasActiveInternship, error: null };

  } catch (error) {
    console.error("Erro ao buscar estágios no servidor:", error);
    return { data: [], hasActiveInternship: false, error: 'Não foi possível carregar os seus estágios.' };
  }
}

const formatDate = (dateString: Date) => {
  return new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

export default async function MyInternshipsPage() {
  const { data: internships, hasActiveInternship, error } = await getStudentInternships();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Meus Estágios</h1>
        {hasActiveInternship ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
              ⚠️ Você já possui um estágio em andamento
            </span>
          </div>
        ) : (
          <Link href="/dashboard/internships/new" className="bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
            Solicitar Novo Estágio
          </Link>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        {error && <p className="text-red-500">{error}</p>}
        {!error && internships.length === 0 && (
          <p className="text-gray-700">Você ainda não possui nenhum estágio registado.</p>
        )}
        {!error && internships.length > 0 && (
          <ul className="space-y-6">
            {internships.map((internship) => (
              <li key={internship.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">{internship.companyName}</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(internship.startDate)} - {formatDate(internship.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusMap[internship.status]?.color ?? 'bg-gray-100'}`}>
                      {statusMap[internship.status]?.text ?? 'Desconhecido'}
                    </span>
                    <Link
                      href={`/dashboard/internships/${internship.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>

                {internship.status === InternshipStatus.REJECTED && internship.rejectionReason && (
                  <div className="mt-4 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="text-sm font-semibold text-yellow-800">Observações da Agência:</p>
                    <p className="text-sm text-yellow-700 mt-1">&ldquo;{internship.rejectionReason}&rdquo;</p>
                    <Link href={`/dashboard/internships/edit/${internship.id}`} className="inline-block mt-3 text-sm font-medium text-green-700 hover:text-green-900">
                      Corrigir e Reenviar
                    </Link>
                  </div>
                )}

                {internship.status === InternshipStatus.CANCELED && internship.rejectionReason && (
                  <div className="mt-4 p-3 bg-gray-50 border-l-4 border-gray-400">
                    <p className="text-sm font-semibold text-gray-800">Observacao:</p>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{internship.rejectionReason}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
