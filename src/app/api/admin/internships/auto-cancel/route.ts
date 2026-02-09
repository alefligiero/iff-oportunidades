import { NextResponse, type NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { InternshipStatus, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DAYS_TO_CANCEL = 7;
const CANCELED_NOTE = 'Cancelado automaticamente apos 7 dias em recusado sem correcoes.';

export async function POST(request: NextRequest) {
  const headersList = headers();
  const userId = (await headersList).get('x-user-id');
  const userRole = (await headersList).get('x-user-role');

  if (!userId || userRole !== Role.ADMIN) {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' }, { status: 403 });
  }

  try {
    const cutoffDate = new Date(Date.now() - DAYS_TO_CANCEL * 24 * 60 * 60 * 1000);

    const toCancel = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.REJECTED,
        rejectedAt: {
          not: null,
          lte: cutoffDate,
        },
      },
      select: {
        id: true,
        rejectionReason: true,
      },
    });

    const updates = toCancel.map((internship) => {
      const reason = internship.rejectionReason
        ? `${internship.rejectionReason}\n\n${CANCELED_NOTE}`
        : CANCELED_NOTE;

      return prisma.internship.update({
        where: { id: internship.id },
        data: {
          status: InternshipStatus.CANCELED,
          rejectionReason: reason,
        },
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({
      updated: toCancel.length,
      cutoffDate: cutoffDate.toISOString(),
      daysToCancel: DAYS_TO_CANCEL,
    });
  } catch (error: unknown) {
    console.error('Erro ao cancelar estágios recusados:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
