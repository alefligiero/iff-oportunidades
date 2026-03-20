import { NextResponse, type NextRequest } from 'next/server';
import { NotificationType, Role, InternshipStatus } from '@prisma/client';
import { parseDateOnlyToUtc, compareDatesBRT } from '@/lib/date-utils';
import {
  getExpectedExtensionStartDate,
  getMaximumAllowedInternshipEndDate,
  isInternshipExtensionWithinLimit,
  MAX_INTERNSHIP_MONTHS_SAME_COMPANY,
} from '@/lib/internship-extension-policy';
import { requestInternshipExtensionSchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || userRole !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas alunos podem solicitar prorrogação.' },
        { status: 403 }
      );
    }

    const internship = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        student: { userId },
      },
      select: {
        id: true,
        companyName: true,
        startDate: true,
        endDate: true,
        status: true,
        internshipExtensionRequested: true,
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado ou não pertence ao aluno.' }, { status: 404 });
    }

    if (internship.status !== InternshipStatus.IN_PROGRESS) {
      return NextResponse.json(
        { error: 'A prorrogação só pode ser solicitada para estágios em andamento.' },
        { status: 400 }
      );
    }

    if (internship.internshipExtensionRequested) {
      return NextResponse.json({ error: 'Já existe uma solicitação de prorrogação em análise.' }, { status: 409 });
    }

    const body = await request.json();
    const validation = requestInternshipExtensionSchema.safeParse(body);

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors)
        .flatMap((messages) => messages ?? [])
        .find((message): message is string => Boolean(message));

      return NextResponse.json(
        { error: firstError ?? 'Dados inválidos.', details: fieldErrors },
        { status: 400 }
      );
    }

    const extensionStartDate = parseDateOnlyToUtc(validation.data.extensionStartDate);
    const extensionEndDate = parseDateOnlyToUtc(validation.data.extensionEndDate);

    if (Number.isNaN(extensionStartDate.getTime()) || Number.isNaN(extensionEndDate.getTime())) {
      return NextResponse.json({ error: 'Datas inválidas para solicitação de prorrogação.' }, { status: 400 });
    }

    const expectedStartDate = getExpectedExtensionStartDate(internship.endDate);

    if (compareDatesBRT(extensionStartDate, expectedStartDate) !== 0) {
      return NextResponse.json(
        {
          error: 'A prorrogação deve iniciar no primeiro dia após o término atual do estágio.',
          expectedExtensionStartDate: expectedStartDate.toISOString().slice(0, 10),
        },
        { status: 400 }
      );
    }

    if (compareDatesBRT(extensionEndDate, extensionStartDate) <= 0) {
      return NextResponse.json(
        { error: 'A data final da prorrogação deve ser posterior à data inicial.' },
        { status: 400 }
      );
    }

    if (!isInternshipExtensionWithinLimit(internship.startDate, extensionEndDate)) {
      const maxAllowedEndDate = getMaximumAllowedInternshipEndDate(internship.startDate);
      return NextResponse.json(
        {
          error: `O prazo total do estágio não pode ultrapassar ${MAX_INTERNSHIP_MONTHS_SAME_COMPANY} meses na mesma empresa.`,
          maxAllowedEndDate: maxAllowedEndDate.toISOString().slice(0, 10),
        },
        { status: 400 }
      );
    }

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        internshipExtensionRequested: true,
        internshipExtensionRequestedAt: new Date(),
        internshipExtensionReason: validation.data.reason.trim(),
        internshipExtensionApproved: null,
        internshipExtensionHandledAt: null,
        internshipExtensionRejectionReason: null,
        internshipExtensionStartDate: extensionStartDate,
        internshipExtensionEndDate: extensionEndDate,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    const student = await prisma.student.findFirst({
      where: { userId },
      select: { name: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.INTERNSHIP_STATUS,
          title: 'Nova solicitação de prorrogação',
          message: `Aluno ${student?.name ?? 'Aluno'} solicitou prorrogação do estágio na empresa ${updated.companyName}.`,
          href: `/dashboard/admin/internships/${updated.id}`,
        })),
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Erro ao solicitar prorrogação do estágio:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
