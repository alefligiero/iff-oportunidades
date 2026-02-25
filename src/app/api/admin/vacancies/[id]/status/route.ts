import { NextResponse, type NextRequest } from 'next/server';
import { VacancyStatus, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { prisma } from '@/lib/prisma';

const updateVacancyStatusSchema = z.object({
  status: z.enum([VacancyStatus.APPROVED, VacancyStatus.REJECTED, VacancyStatus.CLOSED_BY_ADMIN]),
  rejectionReason: z.string().optional(),
  closureReason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vacancyId = params.id;

    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateVacancyStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, rejectionReason, closureReason } = validation.data;

    const updatedVacancy = await prisma.jobVacancy.update({
      where: {
        id: vacancyId,
      },
      data: {
        status,
        ...(status === VacancyStatus.REJECTED && rejectionReason ? { rejectionReason } : {}),
        ...(status === VacancyStatus.CLOSED_BY_ADMIN && closureReason ? { closureReason } : {}),
      },
      include: {
        company: {
          select: {
            name: true,
            userId: true,
          },
        },
      },
    });

    const statusMessages: Record<VacancyStatus, { title: string; message: string }> = {
      [VacancyStatus.PENDING_APPROVAL]: {
        title: 'Vaga pendente de aprovacao',
        message: `A vaga ${updatedVacancy.title} esta pendente de aprovacao.`,
      },
      [VacancyStatus.APPROVED]: {
        title: 'Vaga aprovada',
        message: `A vaga ${updatedVacancy.title} foi aprovada pelo admin.`,
      },
      [VacancyStatus.REJECTED]: {
        title: 'Vaga rejeitada',
        message: `A vaga ${updatedVacancy.title} foi rejeitada pelo admin.${rejectionReason ? ` Motivo: ${rejectionReason}.` : ''}`,
      },
      [VacancyStatus.CLOSED_BY_COMPANY]: {
        title: 'Vaga fechada',
        message: `A vaga ${updatedVacancy.title} foi fechada pela empresa.`,
      },
      [VacancyStatus.CLOSED_BY_ADMIN]: {
        title: 'Vaga fechada pelo admin',
        message: `A vaga ${updatedVacancy.title} foi fechada pelo admin.${closureReason ? ` Motivo: ${closureReason}.` : ''}`,
      },
    };

    await prisma.notification.create({
      data: {
        userId: updatedVacancy.company.userId,
        type: NotificationType.VACANCY_STATUS,
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        href: `/dashboard/vacancies/${updatedVacancy.id}`,
      },
    });

    return NextResponse.json(updatedVacancy);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao atualizar status da vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
