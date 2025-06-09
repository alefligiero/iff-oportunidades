import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, VacancyStatus } from '@prisma/client';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

const updateVacancyStatusSchema = z.object({
  status: z.enum([VacancyStatus.APPROVED, VacancyStatus.REJECTED]),
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

    const { status } = validation.data;

    const updatedVacancy = await prisma.jobVacancy.update({
      where: {
        id: vacancyId,
      },
      data: {
        status,
      },
    });

    // TODO: Implementar logíca de uma notificação pode ser enviada à empresa informando a decisão.

    return NextResponse.json(updatedVacancy);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao atualizar status da vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
