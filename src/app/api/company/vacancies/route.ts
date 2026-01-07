import { NextResponse, type NextRequest } from 'next/server';
import { Role } from '@prisma/client';
import { createVacancySchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    // Validação de autenticação e autorização
    if (!userId || userRole !== 'COMPANY') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas empresas podem publicar vagas.' }, 
        { status: 403 }
      );
    }

    // Verificar se a empresa existe
    const companyProfile = await prisma.company.findUnique({
      where: { userId: userId },
    });

    if (!companyProfile) {
      return NextResponse.json(
        { error: 'Perfil de empresa não encontrado.' }, 
        { status: 404 }
      );
    }

    // Parse do body com tratamento de erro
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique o formato dos dados enviados.' }, 
        { status: 400 }
      );
    }

    // Validação com Zod
    const validation = createVacancySchema.safeParse(body);

    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      
      return NextResponse.json({ 
        error: 'Dados da vaga inválidos.',
        message: firstError || 'Verifique os campos e tente novamente.',
        details: errors 
      }, { status: 400 });
    }

    const { 
      title, 
      description, 
      type, 
      remuneration, 
      workload,
      modality,
      eligibleCourses,
      minPeriod,
      responsibilities,
      technicalSkills,
      softSkills,
      benefits,
      contactInfo
    } = validation.data;

    // Validações adicionais de negócio
    if (type === 'INTERNSHIP' && workload > 30) {
      return NextResponse.json(
        { error: 'Estágios não podem ter carga horária superior a 30 horas semanais.' },
        { status: 400 }
      );
    }

    if (eligibleCourses.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um curso elegível para a vaga.' },
        { status: 400 }
      );
    }

    // Criar a vaga
    const newVacancy = await prisma.jobVacancy.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        type,
        remuneration,
        workload,
        modality,
        eligibleCourses,
        minPeriod,
        responsibilities: responsibilities.trim(),
        technicalSkills: technicalSkills.trim(),
        softSkills: softSkills.trim(),
        benefits: benefits?.trim(),
        contactInfo: contactInfo.trim(),
        companyId: companyProfile.id,
      },
    });

    console.log(`Nova vaga criada: ${newVacancy.id} - ${newVacancy.title} por empresa ${companyProfile.name}`);

    // TODO: Implementar notificação aos administradores sobre a nova vaga.

    return NextResponse.json({
      success: true,
      data: newVacancy,
      message: 'Vaga enviada para aprovação com sucesso!'
    }, { status: 201 });

  } catch (error: unknown) {
    console.error('Erro ao criar vaga:', error);
    
    // Tratamento de erros específicos do Prisma
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'Já existe uma vaga com essas características.' },
          { status: 409 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Erro ao vincular vaga à empresa.' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.' }, 
      { status: 500 }
    );
  }
}

