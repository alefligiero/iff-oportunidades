import { NextResponse, type NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { requestEarlyTerminationSchema } from '@/lib/validations/schemas';
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
      return NextResponse.json({ error: 'Acesso negado. Apenas alunos podem solicitar encerramento.' }, { status: 403 });
    }

    const internship = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        student: { userId },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado ou não pertence ao aluno.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = requestEarlyTerminationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    if (internship.earlyTerminationRequested) {
      return NextResponse.json({ error: 'Já existe uma solicitação de encerramento em análise.' }, { status: 409 });
    }

    const { reason } = validation.data;

    const updated = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        earlyTerminationRequested: true,
        earlyTerminationReason: reason,
        earlyTerminationApproved: null,
        earlyTerminationHandledAt: null,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Erro ao solicitar encerramento antecipado:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
