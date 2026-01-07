import { NextResponse, type NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vacancyId } = await params;

    const userRole = request.headers.get('x-user-role') as Role;

    if (!userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes.' }, { status: 401 });
    }

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Verificar se a vaga existe
    const vacancy = await prisma.jobVacancy.findUnique({
      where: { id: vacancyId },
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vaga não encontrada.' }, { status: 404 });
    }

    // Deletar a vaga
    await prisma.jobVacancy.delete({
      where: { id: vacancyId },
    });

    return NextResponse.json({ message: 'Vaga deletada com sucesso.' });

  } catch (error: unknown) {
    console.error('Erro ao deletar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
