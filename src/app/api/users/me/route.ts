import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    const { userId, role } = userPayload;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilizador não encontrado.' }, { status: 404 });
    }

    let name: string | null = null;
    if (role === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({
        where: { userId },
        select: { name: true },
      });
      name = studentProfile?.name ?? null;
    } else if (role === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({
        where: { userId },
        select: { name: true },
      });
      name = companyProfile?.name ?? null;
    } else if (role === 'ADMIN') {
        name = 'Administrador';
    }

    return NextResponse.json({ ...user, name });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao obter dados do utilizador:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
