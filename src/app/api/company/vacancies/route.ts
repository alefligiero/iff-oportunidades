import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { createVacancySchema } from '@/lib/validations/schemas';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || userRole !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado. Apenas empresas podem publicar vagas.' }, { status: 403 });
    }

    const companyProfile = await prisma.company.findUnique({
      where: { userId: userId },
    });

    if (!companyProfile) {
      return NextResponse.json({ error: 'Perfil de empresa não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = createVacancySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados da vaga inválidos.', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, description, type, remuneration, workload } = validation.data;

    const newVacancy = await prisma.jobVacancy.create({
      data: {
        title,
        description,
        type,
        remuneration,
        workload,
        companyId: companyProfile.id,
      },
    });

    // TODO: Implementar a lógica para uma notificação poder ser enviada aos administradores sobre a nova vaga.

    return NextResponse.json(newVacancy, { status: 201 });

  } catch (error: unknown) {
    console.error('Erro ao criar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

