import { NextResponse, type NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes.' }, { status: 401 });
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem visualizar as vagas aprovadas.' }, { status: 403 });
    }

    const approvedVacancies = await prisma.jobVacancy.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(approvedVacancies);

  } catch (error: unknown) {
    console.error('Erro ao listar vagas aprovadas:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
