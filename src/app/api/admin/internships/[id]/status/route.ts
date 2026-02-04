import { NextResponse, type NextRequest } from 'next/server';
import { InternshipStatus, Role } from '@prisma/client';
import { z } from 'zod';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

const updateStatusSchema = z.object({
  status: z.enum([InternshipStatus.APPROVED, InternshipStatus.CANCELED, InternshipStatus.IN_PROGRESS]),
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

    if (status === InternshipStatus.CANCELED && !rejectionReason) {
      return NextResponse.json({ error: 'É obrigatório fornecer um motivo para a recusa.' }, { status: 400 });
    }

    if (status === InternshipStatus.IN_PROGRESS) {
      const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        include: { documents: true },
      });

      if (!internship) {
        return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
      }

      if (internship.status !== InternshipStatus.APPROVED) {
        return NextResponse.json({ error: 'O estágio precisa estar aprovado para iniciar.' }, { status: 400 });
      }

      const hasSignedContract = internship.documents.some(
        (doc) => doc.type === 'SIGNED_CONTRACT' && doc.status === 'APPROVED'
      );
      const hasLifeInsurance = internship.documents.some(
        (doc) => doc.type === 'LIFE_INSURANCE' && doc.status === 'APPROVED'
      );

      if (!hasSignedContract || !hasLifeInsurance) {
        return NextResponse.json(
          { error: 'É necessário aprovar o TCE + PAE assinados e o seguro de vida para iniciar o estágio.' },
          { status: 400 }
        );
      }
    }

    const updatedInternship = await prisma.internship.update({
      where: {
        id: internshipId,
      },
      data: {
        status,
        rejectionReason: status === InternshipStatus.CANCELED ? rejectionReason : null,
      },
    });

    // TODO: Implementar a lógica para enviar uma notificação por email para o aluno.

    return NextResponse.json(updatedInternship);

  } catch (error: unknown) {
    console.error('Erro ao atualizar status do estágio:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Dados inválidos.', details: error.flatten().fieldErrors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

