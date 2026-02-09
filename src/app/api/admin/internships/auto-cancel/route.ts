import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { InternshipStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DAYS_TO_CANCEL = 7;

export async function POST(request: NextRequest) {
  const headersList = headers();
  const userId = (await headersList).get('x-user-id');
  const userRole = (await headersList).get('x-user-role');

  if (!userId || userRole !== Role.ADMIN) {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' }, { status: 403 });
  }

  try {
    const cutoffDate = new Date(Date.now() - DAYS_TO_CANCEL * 24 * 60 * 60 * 1000);

    const result = await prisma.internship.updateMany({
      where: {
        status: InternshipStatus.REJECTED,
        rejectedAt: {
          not: null,
          lte: cutoffDate,
        },
      },
      data: {
        status: InternshipStatus.CANCELED,
      },
    });

    return NextResponse.json({
      updated: result.count,
      cutoffDate: cutoffDate.toISOString(),
      daysToCancel: DAYS_TO_CANCEL,
    });
  } catch (error: unknown) {
    console.error('Erro ao cancelar estágios recusados:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
