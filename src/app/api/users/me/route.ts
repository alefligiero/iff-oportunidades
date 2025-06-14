import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes. Acesso negado pelo middleware.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    let name: string | null = null;
    if (userRole === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({
        where: { userId },
        select: { name: true },
      });
      name = studentProfile?.name ?? null;
    } else if (userRole === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({
        where: { userId },
        select: { name: true },
      });
      name = companyProfile?.name ?? null;
    } else if (userRole === 'ADMIN') {
        name = 'Administrador';
    }

    return NextResponse.json({ ...user, name });

  } catch (error: unknown) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
