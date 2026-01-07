import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem visualizar as vagas pendentes.' }, { status: 403 });
    }

    const pendingVacancies = await prisma.jobVacancy.findMany({
      where: {
        status: 'PENDING_APPROVAL',
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(pendingVacancies);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao listar vagas pendentes:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
