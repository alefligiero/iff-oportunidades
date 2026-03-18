import { NextResponse, type NextRequest } from 'next/server';
import { InternshipStatus, Role, NotificationType } from '@prisma/client';
import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getSystemConfig } from '@/lib/system-config';
import { parseDateOnlyToUtc } from '@/lib/date-utils';
import { adminUpdateInternshipStatusSchema } from '@/lib/validations/schemas';

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
    const validation = adminUpdateInternshipStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, rejectionReason, insuranceData } = validation.data;
    const trimmedReason = rejectionReason?.trim();
    const systemConfig = await getSystemConfig();
    const shouldRequireAdminInsuranceData = status === InternshipStatus.APPROVED && !systemConfig.requireLifeInsuranceForNewInternships;

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

    const reasonRequiredStatuses = new Set<InternshipStatus>([
      InternshipStatus.REJECTED,
      InternshipStatus.FINISHED,
      InternshipStatus.CANCELED,
    ]);
    const isReasonRequired = reasonRequiredStatuses.has(status);

    if (isReasonRequired && !trimmedReason) {
      return NextResponse.json({ error: 'É obrigatório fornecer um motivo.' }, { status: 400 });
    }

    if (shouldRequireAdminInsuranceData && !insuranceData) {
      return NextResponse.json(
        { error: 'Preencha os dados do seguro para aprovar a formalização.' },
        { status: 400 }
      );
    }

    if (shouldRequireAdminInsuranceData && insuranceData) {
      const insuranceStartDate = parseDateOnlyToUtc(insuranceData.insuranceStartDate);
      const insuranceEndDate = parseDateOnlyToUtc(insuranceData.insuranceEndDate);

      if (insuranceEndDate < insuranceStartDate) {
        return NextResponse.json(
          { error: 'A vigência final do seguro deve ser igual ou posterior à vigência inicial.' },
          { status: 400 }
        );
      }
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
      const closedStatuses = new Set<InternshipStatus>([
        InternshipStatus.FINISHED,
        InternshipStatus.CANCELED,
      ]);
      if (closedStatuses.has(internship.status)) {
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
      updateData.approvedAt = null;
    } else if (status === InternshipStatus.CANCELED) {
      updateData.rejectionReason = trimmedReason;
      updateData.rejectedAt = null;
      updateData.approvedAt = null;
    } else {
      updateData.rejectionReason = null;
      updateData.rejectedAt = null;

      if (status === InternshipStatus.APPROVED) {
        updateData.approvedAt = new Date();

        if (shouldRequireAdminInsuranceData && insuranceData) {
          updateData.insuranceCompany = insuranceData.insuranceCompany.trim();
          updateData.insuranceCompanyCnpj = insuranceData.insuranceCompanyCnpj.trim();
          updateData.insurancePolicyNumber = insuranceData.insurancePolicyNumber.trim();
          updateData.insuranceStartDate = parseDateOnlyToUtc(insuranceData.insuranceStartDate);
          updateData.insuranceEndDate = parseDateOnlyToUtc(insuranceData.insuranceEndDate);
        }
      }
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

