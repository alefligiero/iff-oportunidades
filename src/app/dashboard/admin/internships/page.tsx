import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import { PrismaClient, Role } from '@prisma/client';
import InternshipsPageContent from './InternshipsPageContent';

const prisma = new PrismaClient();

async function getAllInternships() {
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

    const internships = await prisma.internship.findMany({
      include: {
        student: {
          select: {
            name: true,
            matricula: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return internships;

  } catch (error) {
    console.error("Erro ao buscar estágios:", error);
    redirect('/'); 
  }
}

export default async function InternshipsPage() {
  const internships = await getAllInternships();

  return <InternshipsPageContent allInternships={internships} />;
}
