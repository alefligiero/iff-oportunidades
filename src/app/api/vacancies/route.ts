import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    await getUserFromToken(request);

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
        createdAt: 'desc',
      },
    });

    return NextResponse.json(approvedVacancies);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao listar vagas aprovadas:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
