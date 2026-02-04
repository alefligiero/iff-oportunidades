import { NextResponse, type NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { decideEarlyTerminationSchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userRole = request.headers.get('x-user-role') as Role;

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem decidir solicitações.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = decideEarlyTerminationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const internship = await prisma.internship.findUnique({ where: { id: internshipId } });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    if (!internship.earlyTerminationRequested) {
      return NextResponse.json({ error: 'Não há solicitação de encerramento para este estágio.' }, { status: 409 });
    }

    const { action, rejectionReason } = validation.data;

    if (action === 'APPROVE') {
      const updated = await prisma.internship.update({
        where: { id: internshipId },
        data: {
          status: 'FINISHED',
          earlyTerminationApproved: true,
          earlyTerminationHandledAt: new Date(),
          rejectionReason: null,
        },
      });

      return NextResponse.json(updated, { status: 200 });
    }

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        earlyTerminationRequested: false,
        earlyTerminationApproved: false,
        earlyTerminationHandledAt: new Date(),
        earlyTerminationRejectionReason: rejectionReason || null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Erro ao decidir encerramento antecipado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
