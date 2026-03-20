import { NextResponse, type NextRequest } from 'next/server';
import { NotificationType, Role } from '@prisma/client';
import { compareDatesBRT, parseDateOnlyToUtc } from '@/lib/date-utils';
import {
  getExpectedExtensionStartDate,
  getMaximumAllowedInternshipEndDate,
  isInternshipExtensionWithinLimit,
  MAX_INTERNSHIP_MONTHS_SAME_COMPANY,
} from '@/lib/internship-extension-policy';
import { decideInternshipExtensionSchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userRole = request.headers.get('x-user-role') as Role;

    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem decidir solicitações.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = decideInternshipExtensionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      select: {
        id: true,
        companyName: true,
        startDate: true,
        endDate: true,
        internshipExtensionRequested: true,
        student: {
          select: { userId: true },
        },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    if (!internship.internshipExtensionRequested) {
      return NextResponse.json({ error: 'Não há solicitação de prorrogação para este estágio.' }, { status: 409 });
    }

    const { action } = validation.data;

    if (action === 'APPROVE') {
      const approvedStartRaw = validation.data.approvedExtensionStartDate;
      const approvedEndRaw = validation.data.approvedExtensionEndDate;

      if (!approvedStartRaw || !approvedEndRaw) {
        return NextResponse.json(
          { error: 'Datas aprovadas são obrigatórias para aprovar a prorrogação.' },
          { status: 400 }
        );
      }

      const approvedExtensionStartDate = parseDateOnlyToUtc(approvedStartRaw);
      const approvedExtensionEndDate = parseDateOnlyToUtc(approvedEndRaw);

      if (
        Number.isNaN(approvedExtensionStartDate.getTime()) ||
        Number.isNaN(approvedExtensionEndDate.getTime())
      ) {
        return NextResponse.json({ error: 'Datas aprovadas inválidas.' }, { status: 400 });
      }

      if (compareDatesBRT(approvedExtensionEndDate, approvedExtensionStartDate) <= 0) {
        return NextResponse.json(
          { error: 'A data final aprovada deve ser posterior à data inicial aprovada.' },
          { status: 400 }
        );
      }

      const expectedStartDate = getExpectedExtensionStartDate(internship.endDate);
      if (compareDatesBRT(approvedExtensionStartDate, expectedStartDate) !== 0) {
        return NextResponse.json(
          {
            error: 'A prorrogação deve iniciar no primeiro dia após o término atual do estágio.',
            expectedExtensionStartDate: expectedStartDate.toISOString().slice(0, 10),
          },
          { status: 400 }
        );
      }

      if (!isInternshipExtensionWithinLimit(internship.startDate, approvedExtensionEndDate)) {
        const maxAllowedEndDate = getMaximumAllowedInternshipEndDate(internship.startDate);
        return NextResponse.json(
          {
            error: `O prazo total do estágio não pode ultrapassar ${MAX_INTERNSHIP_MONTHS_SAME_COMPANY} meses na mesma empresa.`,
            maxAllowedEndDate: maxAllowedEndDate.toISOString().slice(0, 10),
          },
          { status: 400 }
        );
      }

      const now = new Date();

      const [updated] = await prisma.$transaction([
        prisma.internship.update({
          where: { id: internshipId },
          data: {
            internshipExtensionRequested: false,
            internshipExtensionApproved: true,
            internshipExtensionHandledAt: now,
            internshipExtensionRejectionReason: null,
            internshipExtensionStartDate: approvedExtensionStartDate,
            internshipExtensionEndDate: approvedExtensionEndDate,
          },
        }),
        prisma.notification.create({
          data: {
            userId: internship.student.userId,
            type: NotificationType.INTERNSHIP_STATUS,
            title: 'Prorrogação de estágio aprovada',
            message: `Sua solicitação de prorrogação do estágio na empresa ${internship.companyName} foi aprovada. Envie o Termo Aditivo assinado para análise.`,
            href: `/dashboard/internships/${internship.id}`,
          },
        }),
      ]);

      return NextResponse.json(updated, { status: 200 });
    }

    const trimmedRejectionReason = validation.data.rejectionReason?.trim();

    const now = new Date();
    const [updated] = await prisma.$transaction([
      prisma.internship.update({
        where: { id: internshipId },
        data: {
          internshipExtensionRequested: false,
          internshipExtensionApproved: false,
          internshipExtensionHandledAt: now,
          internshipExtensionRejectionReason: trimmedRejectionReason || null,
        },
      }),
      prisma.notification.create({
        data: {
          userId: internship.student.userId,
          type: NotificationType.INTERNSHIP_STATUS,
          title: 'Prorrogação de estágio recusada',
          message: `Sua solicitação de prorrogação do estágio na empresa ${internship.companyName} foi recusada.${trimmedRejectionReason ? ` Motivo: ${trimmedRejectionReason}.` : ''}`,
          href: `/dashboard/internships/${internship.id}`,
        },
      }),
    ]);

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Erro ao decidir prorrogação do estágio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
