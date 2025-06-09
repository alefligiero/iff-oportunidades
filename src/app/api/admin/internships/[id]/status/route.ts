import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, InternshipStatus } from '@prisma/client';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

const updateStatusSchema = z.object({
  status: z.enum([InternshipStatus.APPROVED, InternshipStatus.CANCELED]),
  rejectionComments: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const internshipId = params.id;

    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateStatusSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { status, rejectionComments } = validation.data;

    if (status !== InternshipStatus.CANCELED && rejectionComments) {
        return NextResponse.json({ error: 'Comentários de rejeição só podem ser enviados ao recusar um estágio.' }, { status: 400 });
    }

    const updatedInternship = await prisma.internship.update({
      where: {
        id: internshipId,
      },
      data: {
        status: status,
      },
    });

    // TODO: Implementar a lógica para enviar uma notificação por email para o aluno.

    return NextResponse.json(updatedInternship);

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao atualizar status do estágio:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
