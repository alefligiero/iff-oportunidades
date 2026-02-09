import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { VacancyStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DAYS_TO_CLOSE = 7;
const CLOSED_NOTE = 'Fechada automaticamente apos 7 dias em rejeitada sem correcoes.';

export async function POST(request: NextRequest) {
  const headersList = headers();
  const userId = (await headersList).get('x-user-id');
  const userRole = (await headersList).get('x-user-role');

  if (!userId || userRole !== Role.ADMIN) {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' }, { status: 403 });
  }

  try {
    const cutoffDate = new Date(Date.now() - DAYS_TO_CLOSE * 24 * 60 * 60 * 1000);

    const toClose = await prisma.jobVacancy.findMany({
      where: {
        status: VacancyStatus.REJECTED,
        updatedAt: {
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
      },
    });

    const updates = toClose.map((vacancy) =>
      prisma.jobVacancy.update({
        where: { id: vacancy.id },
        data: {
          status: VacancyStatus.CLOSED_BY_ADMIN,
          closureReason: CLOSED_NOTE,
        },
      })
    );

    await prisma.$transaction(updates);

    return NextResponse.json({
      updated: toClose.length,
      cutoffDate: cutoffDate.toISOString(),
      daysToClose: DAYS_TO_CLOSE,
    });
  } catch (error: unknown) {
    console.error('Erro ao fechar vagas rejeitadas:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
