import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';

const updateInsuranceSchema = z.object({
  insuranceCompany: z.string().min(1, 'Nome da seguradora obrigatório'),
  insurancePolicyNumber: z.string().min(1, 'Número da apólice obrigatório'),
  insuranceCompanyCnpj: z.string().min(14, 'CNPJ inválido'),
  insuranceStartDate: z.string().transform(val => val ? new Date(val) : null).nullable(),
  insuranceEndDate: z.string().transform(val => val ? new Date(val) : null).nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;
    const userPayload = await getUserFromToken(request);

    if (!userPayload || userPayload.role !== 'STUDENT') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Verificar se o estágio pertence ao aluno
    const internship = await prisma.internship.findFirst({
      where: {
        id: internshipId,
        student: { userId: userPayload.userId },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    const body = await request.json();
    const validation = updateInsuranceSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updatedInternship = await prisma.internship.update({
      where: { id: internshipId },
      data: {
        insuranceCompany: validation.data.insuranceCompany,
        insurancePolicyNumber: validation.data.insurancePolicyNumber,
        insuranceCompanyCnpj: validation.data.insuranceCompanyCnpj,
        insuranceStartDate: validation.data.insuranceStartDate,
        insuranceEndDate: validation.data.insuranceEndDate,
      },
    });

    return NextResponse.json({ 
      message: 'Dados do seguro atualizados com sucesso',
      internship: updatedInternship 
    });

  } catch (error) {
    console.error('Erro ao atualizar dados do seguro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
