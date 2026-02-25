import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile } from '@/lib/file-upload';
import { NotificationType, Role } from '@prisma/client';

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
      include: {
        student: {
          select: { name: true },
        },
      },
    });

    if (!internship) {
      return NextResponse.json({ error: 'Estágio não encontrado.' }, { status: 404 });
    }

    // Bloquear envio se estágio foi cancelado
    if (internship.status === 'CANCELED') {
      return NextResponse.json(
        { error: 'Não é possível enviar documentos para um estágio cancelado.' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const insuranceFile = formData.get('insurance') as File | null;
    const insuranceCompany = (formData.get('insuranceCompany') as string | null)?.trim() || '';
    const insurancePolicyNumber = (formData.get('insurancePolicyNumber') as string | null)?.trim() || '';
    const insuranceCompanyCnpj = (formData.get('insuranceCompanyCnpj') as string | null)?.trim() || '';
    const insuranceStartDate = (formData.get('insuranceStartDate') as string | null) || '';
    const insuranceEndDate = (formData.get('insuranceEndDate') as string | null) || '';

    const hasAllInsuranceFields = Boolean(
      insuranceCompany &&
      insurancePolicyNumber &&
      insuranceCompanyCnpj &&
      insuranceStartDate &&
      insuranceEndDate
    );

    if (!insuranceFile || !hasAllInsuranceFields) {
      return NextResponse.json(
        { error: 'Envie os dados do seguro e o comprovante no mesmo envio.' },
        { status: 400 }
      );
    }

    const updatedInternship = await prisma.$transaction(async (tx) => {
      const internshipUpdated = await tx.internship.update({
        where: { id: internshipId },
        data: {
          insuranceCompany,
          insurancePolicyNumber,
          insuranceCompanyCnpj,
          insuranceStartDate: new Date(insuranceStartDate),
          insuranceEndDate: new Date(insuranceEndDate),
        },
      });

      const existingInsurance = await tx.document.findFirst({
        where: {
          internshipId,
          type: 'LIFE_INSURANCE',
        },
      });

      if (existingInsurance) {
        await tx.document.delete({
          where: { id: existingInsurance.id },
        });
      }

      const insuranceResult = await processUploadedFile(insuranceFile, internshipId, 'LIFE_INSURANCE');
      if ('error' in insuranceResult) {
        throw new Error(insuranceResult.error);
      }

      await tx.document.create({
        data: {
          type: 'LIFE_INSURANCE',
          fileUrl: insuranceResult.file.url,
          status: 'PENDING_ANALYSIS',
          internshipId,
        },
      });

      return internshipUpdated;
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.DOCUMENT_SUBMITTED,
          title: 'Documento enviado para analise',
          message: `Aluno ${internship.student.name} enviou comprovante do Seguro de Vida para o estagio na empresa ${internship.companyName}.`,
          href: `/dashboard/admin/internships/${internship.id}`,
        })),
      });
    }

    return NextResponse.json({ 
      message: 'Dados do seguro atualizados com sucesso',
      internship: updatedInternship 
    });

  } catch (error) {
    console.error('Erro ao atualizar dados do seguro:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
