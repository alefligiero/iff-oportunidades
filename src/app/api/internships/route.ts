import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, InternshipType } from '@prisma/client';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

const createInternshipSchema = z.object({
  startDate: z.string().datetime({ message: 'A data de início deve ser uma data válida.' }),
  endDate: z.string().datetime({ message: 'A data de término deve ser uma data válida.' }),
  type: z.nativeEnum(InternshipType),
  companyId: z.string().cuid({ message: 'ID da empresa inválido.' }),
});

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (userPayload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Acesso negado. Apenas alunos podem criar estágios.' }, { status: 403 });
    }

    const studentProfile = await prisma.student.findUnique({
      where: { userId: userPayload.userId },
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Perfil de aluno não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createInternshipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { startDate, endDate, type, companyId } = validation.data;

    const newInternship = await prisma.$transaction(async (tx) => {
      const internship = await tx.internship.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
          studentId: studentProfile.id,
          companyId,
        },
      });

      await tx.document.createMany({
        data: [
          { type: 'TCE', internshipId: internship.id },
          { type: 'PAE', internshipId: internship.id },
        ],
      });

      return internship;
    });

    return NextResponse.json(newInternship, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao criar estágio:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
