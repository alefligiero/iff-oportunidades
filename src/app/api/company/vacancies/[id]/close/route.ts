import { NextResponse, type NextRequest } from 'next/server';
import { Role, VacancyStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: vacancyId } = await params;
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes.' }, { status: 401 });
    }

    if (userRole !== 'COMPANY') {
      return NextResponse.json({ error: 'Acesso negado. Apenas empresas podem fechar vagas.' }, { status: 403 });
    }

    // Buscar empresa
    const company = await prisma.company.findUnique({ 
      where: { userId } 
    });

    if (!company) {
      return NextResponse.json({ error: 'Perfil de empresa não encontrado.' }, { status: 404 });
    }

    // Verificar se a vaga pertence à empresa
    const vacancy = await prisma.jobVacancy.findFirst({
      where: { 
        id: vacancyId, 
        companyId: company.id 
      }
    });

    if (!vacancy) {
      return NextResponse.json({ error: 'Vaga não encontrada ou não pertence a esta empresa.' }, { status: 404 });
    }

    // Verificar se a vaga pode ser fechada (apenas aprovadas ou rejeitadas podem ser fechadas)
    if (vacancy.status === VacancyStatus.CLOSED_BY_COMPANY) {
      return NextResponse.json({ error: 'Esta vaga já está fechada.' }, { status: 400 });
    }

    // Fechar a vaga
    const updatedVacancy = await prisma.jobVacancy.update({
      where: { id: vacancyId },
      data: { status: VacancyStatus.CLOSED_BY_COMPANY },
    });

    return NextResponse.json({ 
      message: 'Vaga fechada com sucesso.',
      vacancy: updatedVacancy 
    });

  } catch (error: unknown) {
    console.error('Erro ao fechar vaga:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
