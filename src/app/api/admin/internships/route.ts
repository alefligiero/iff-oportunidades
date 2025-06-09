import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Esta rota é restrita a administradores.' }, { status: 403 });
    }
    
    const pendingInternships = await prisma.internship.findMany({
      where: {
        status: 'IN_ANALYSIS',
      },
      include: {
        student: {
          select: {
            name: true,
            matricula: true,
          },
        },
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

    return NextResponse.json(pendingInternships);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao listar estágios para o admin:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
