// src/app/dashboard/internships/new/page.tsx
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import InternshipForm from './InternshipForm'; // Importa o novo componente de cliente

const prisma = new PrismaClient();

// Função para buscar os dados do utilizador atual no servidor
async function getCurrentUserData() {
  const token = (await cookies()).get('auth_token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET as string);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    const studentProfile = await prisma.student.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } }, // Inclui o email da tabela User
    });

    if (!studentProfile) return null;

    // Retorna os dados necessários para o pré-preenchimento
    return {
      name: studentProfile.name,
      email: studentProfile.user.email,
      matricula: studentProfile.matricula,
    };
  } catch (error) {
    console.error("Falha ao obter dados da sessão do utilizador:", error);
    return null;
  }
}

// A página agora é um Server Component que busca dados
export default async function NewInternshipPage() {
  const userData = await getCurrentUserData();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Formalizar Novo Estágio</h1>
      {/* Renderiza o formulário e passa os dados pré-preenchidos como props */}
      <InternshipForm prefilledData={userData} />
    </div>
  );
}
