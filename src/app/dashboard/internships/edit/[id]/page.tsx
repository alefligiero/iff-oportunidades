import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient, Role } from '@prisma/client';
import { redirect } from 'next/navigation';
import InternshipForm from '../../new/InternshipForm';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

async function getInternshipDataForEdit(internshipId: string) {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return { prefilledData: null, internshipData: null };

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (payload.role !== Role.STUDENT) {
      redirect('/dashboard');
    }

    const studentProfile = await prisma.student.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });

    if (!studentProfile) return { prefilledData: null, internshipData: null };

    const prefilledData = {
      name: studentProfile.name,
      email: studentProfile.user.email,
      matricula: studentProfile.matricula,
    };

    const internshipData = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        studentId: studentProfile.id,
      },
    });

    return { prefilledData, internshipData };
  } catch (error) {
    console.error("Falha ao buscar dados para edição:", error);
    return { prefilledData: null, internshipData: null };
  }
}

export default async function EditInternshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { prefilledData, internshipData } = await getInternshipDataForEdit(id);

  if (!internshipData || !prefilledData) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Estágio não encontrado</h1>
        <p className="mt-2">O estágio que você está a tentar editar não existe ou não pertence à sua conta.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Corrigir e Reenviar Formalização</h1>
      <InternshipForm 
        prefilledData={prefilledData} 
        internshipData={internshipData} 
        isEditing={true} 
      />
    </div>
  );
}
