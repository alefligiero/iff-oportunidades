import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { NotificationType, Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const updateVacancySchema = z.object({
  title: z.string().min(5).optional(),
  description: z.string().min(20).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }
    
    const company = await prisma.company.findUnique({ where: { userId: userPayload.userId }});
    if (!company) {
        return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
    }

    const vacancy = await prisma.jobVacancy.findFirst({
        where: { id: params.id, companyId: company.id }
    });
    if (!vacancy) {
        return NextResponse.json({ error: 'Vaga não encontrada ou não pertence a esta empresa.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateVacancySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten() }, { status: 400 });
    }

    const updatedVacancy = await prisma.jobVacancy.update({
      where: { id: params.id },
      data: { ...validation.data, status: 'PENDING_APPROVAL' }, // Re-submete para aprovação
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.VACANCY_SUBMITTED,
          title: 'Vaga reenviada para aprovacao',
          message: `A empresa ${company.name} reenviou a vaga ${updatedVacancy.title} para aprovacao.`,
          href: `/dashboard/admin/vacancies/${updatedVacancy.id}`,
        })),
      });
    }

    return NextResponse.json(updatedVacancy);

  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const company = await prisma.company.findUnique({ where: { userId: userPayload.userId }});
    if (!company) {
        return NextResponse.json({ error: 'Empresa não encontrada.' }, { status: 404 });
    }

    await prisma.jobVacancy.delete({
      where: { id: params.id, companyId: company.id },
    });

    return NextResponse.json({ message: 'Vaga deletada com sucesso.' }, { status: 200 });
  } catch (error) {
    console.error('Erro ao deletar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno.' }, { status: 500 });
  }
}
