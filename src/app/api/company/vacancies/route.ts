import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, VacancyType } from '@prisma/client';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';

const prisma = new PrismaClient();

const createVacancySchema = z.object({
  title: z.string().min(5, { message: 'O título deve ter no mínimo 5 caracteres.' }),
  description: z.string().min(20, { message: 'A descrição deve ter no mínimo 20 caracteres.' }),
  type: z.nativeEnum(VacancyType, {
    errorMap: () => ({ message: 'Tipo de vaga inválido.' }),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado. Apenas empresas podem publicar vagas.' }, { status: 403 });
    }

    const companyProfile = await prisma.company.findUnique({
      where: { userId: userPayload.userId },
    });

    if (!companyProfile) {
      return NextResponse.json({ error: 'Perfil de empresa não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createVacancySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados da vaga inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, description, type } = validation.data;

    const newVacancy = await prisma.jobVacancy.create({
      data: {
        title,
        description,
        type,
        companyId: companyProfile.id,
      },
    });

    // TODO: Implementar a lógica para uma notificação poder ser enviada aos administradores sobre a nova vaga.

    return NextResponse.json(newVacancy, { status: 201 });

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao criar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
