import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { PrismaClient, Role } from '@prisma/client';
import VacanciesPageContent from './VacanciesPageContent';

const prisma = new PrismaClient();

async function getAllVacancies() {
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
      include: {
        company: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return vacancies;
  } catch (error) {
    console.error('Erro ao buscar vagas:', error);
    redirect('/');
  }
}

export default async function VacanciesPage() {
  const vacancies = await getAllVacancies();
  return <VacanciesPageContent allVacancies={vacancies} />;
}
