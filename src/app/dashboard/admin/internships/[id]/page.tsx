// src/app/dashboard/admin/internships/[id]/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { jwtVerify } from 'jose';
import { PrismaClient, Role } from '@prisma/client';
import ActionButtons from './ActionButtons';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getInternshipDetails(id: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) redirect('/');

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== Role.ADMIN) redirect('/dashboard');

    const internship = await prisma.internship.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    if (!internship) return null;
    
    return internship;

  } catch (error) {
    console.error("Erro ao buscar detalhes do estágio:", error);
    redirect('/dashboard/admin/internships');
  }
}

const DetailItem = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || 'Não informado'}</dd>
    </div>
);

export default async function InternshipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const internship = await getInternshipDetails(id);

  if (!internship) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Estágio não encontrado</h1>
        <p className="mt-2">O estágio que você está a tentar visualizar não existe ou foi movido.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Detalhes da Formalização</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-md">
        <div className="p-4 bg-gray-50 rounded-lg mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ações de Moderação</h3>
            <p className="text-sm text-gray-600 mb-4">Reveja as informações abaixo e aprove ou recuse a solicitação de estágio.</p>
            <ActionButtons internshipId={internship.id} />
        </div>

        <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados do Aluno</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Nome Completo" value={internship.student.name} />
                <DetailItem label="Email" value={internship.student.user.email} />
                <DetailItem label="Matrícula" value={internship.student.matricula} />
            </dl>
        </div>

        <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-8">
                <DetailItem label="Nome da Empresa" value={internship.companyName} />
                <DetailItem label="CNPJ" value={internship.companyCnpj} />
            </dl>
        </div>

      </div>
    </div>
  );
}
