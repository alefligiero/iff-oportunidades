import { NextResponse, type NextRequest } from 'next/server';
import { InternshipStatus, Role, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const updateStatusSchema = z.object({
  status: z.enum([
    InternshipStatus.APPROVED,
    InternshipStatus.REJECTED,
    InternshipStatus.IN_PROGRESS,
    InternshipStatus.FINISHED,
    InternshipStatus.CANCELED,
  ]),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const headersList = headers();
  const userId = (await headersList).get('x-user-id');
  const userRole = (await headersList).get('x-user-role');

  if (!userId || userRole !== Role.ADMIN) {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem realizar esta ação.' }, { status: 403 });
  }
  
  try {
    const { id: internshipId } = await params;

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, rejectionReason } = validation.data;
    const trimmedReason = rejectionReason?.trim();

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        documents: true,
        student: {
          select: { userId: true },
        },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    const isReasonRequired = [
      InternshipStatus.REJECTED,
      InternshipStatus.FINISHED,
      InternshipStatus.CANCELED,
    ].includes(status);

    if (isReasonRequired && !trimmedReason) {
      return NextResponse.json({ error: 'É obrigatório fornecer um motivo.' }, { status: 400 });
    }

    if (status === InternshipStatus.FINISHED) {
      if (internship.status !== InternshipStatus.IN_PROGRESS) {
        return NextResponse.json(
          { error: 'Só é possível concluir um estágio que esteja em andamento.' },
          { status: 400 }
        );
      }
    }

    if (status === InternshipStatus.CANCELED) {
      if ([InternshipStatus.FINISHED, InternshipStatus.CANCELED].includes(internship.status)) {
        return NextResponse.json({ error: 'Este estágio já está encerrado.' }, { status: 400 });
      }
    }

    if (status === InternshipStatus.IN_PROGRESS) {
      const hasSignedContract = internship.documents.some(
        (doc) => doc.type === 'SIGNED_CONTRACT' && doc.status === 'APPROVED'
      );
      const hasLifeInsurance = internship.documents.some(
        (doc) => doc.type === 'LIFE_INSURANCE' && doc.status === 'APPROVED'
      );
      const insuranceRequirementMet = !internship.insuranceRequired || hasLifeInsurance;

      if (!hasSignedContract || !insuranceRequirementMet) {
        return NextResponse.json(
          { error: 'É necessário aprovar o TCE + PAE assinados e, quando exigido, o seguro de vida para iniciar o estágio.' },
          { status: 400 }
        );
      }
    }

    const updateData: Record<string, unknown> = {
      status,
    };

    if (status === InternshipStatus.REJECTED) {
      updateData.rejectionReason = trimmedReason;
      updateData.rejectedAt = new Date();
    } else if (status === InternshipStatus.CANCELED) {
      updateData.rejectionReason = trimmedReason;
      updateData.rejectedAt = null;
    } else {
      updateData.rejectionReason = null;
      updateData.rejectedAt = null;
    }

    if (status === InternshipStatus.FINISHED) {
      updateData.earlyTerminationReason = trimmedReason;
      updateData.earlyTerminationHandledAt = new Date();
      updateData.earlyTerminationRequested = false;
      updateData.earlyTerminationApproved = true;
      updateData.earlyTerminationRejectionReason = null;
    }

    const updatedInternship = await prisma.internship.update({
      where: {
        id: internshipId,
      },
      data: updateData,
    });

    const statusMessages: Record<InternshipStatus, { title: string; message: string }> = {
      [InternshipStatus.IN_ANALYSIS]: {
        title: 'Estagio em analise',
        message: `Sua formalizacao de estagio na empresa ${internship.companyName} esta em analise.`,
      },
      [InternshipStatus.APPROVED]: {
        title: 'Estagio aprovado',
        message: `O admin aprovou sua formalizacao de estagio na empresa ${internship.companyName}.`,
      },
      [InternshipStatus.REJECTED]: {
        title: 'Estagio recusado',
        message: `O admin recusou sua formalizacao de estagio na empresa ${internship.companyName}.${trimmedReason ? ` Motivo: ${trimmedReason}.` : ''}`,
      },
      [InternshipStatus.IN_PROGRESS]: {
        title: 'Estagio iniciado',
        message: `Seu estagio na empresa ${internship.companyName} foi iniciado.`,
      },
      [InternshipStatus.FINISHED]: {
        title: 'Estagio finalizado',
        message: `Seu estagio na empresa ${internship.companyName} foi finalizado.`,
      },
      [InternshipStatus.CANCELED]: {
        title: 'Estagio cancelado',
        message: `Seu estagio na empresa ${internship.companyName} foi cancelado.${trimmedReason ? ` Motivo: ${trimmedReason}.` : ''}`,
      },
    };

    await prisma.notification.create({
      data: {
        userId: internship.student.userId,
        type: NotificationType.INTERNSHIP_STATUS,
        title: statusMessages[status].title,
        message: statusMessages[status].message,
        href: `/dashboard/internships/${internship.id}`,
      },
    });

    return NextResponse.json(updatedInternship);

  } catch (error: unknown) {
    console.error('Erro ao atualizar status do estágio:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Dados inválidos.', details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

