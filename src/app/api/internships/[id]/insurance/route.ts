import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { deleteFile, processUploadedFile } from '@/lib/file-upload';
import { parseDateOnlyToUtc } from '@/lib/date-utils';
import { NotificationType, Role } from '@prisma/client';
import { insuranceUploadPayloadSchema } from '@/lib/validations/schemas';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let uploadedFileUrl: string | null = null;

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
    const payloadParse = insuranceUploadPayloadSchema.safeParse({
      insuranceCompany: formData.get('insuranceCompany'),
      insurancePolicyNumber: formData.get('insurancePolicyNumber'),
      insuranceCompanyCnpj: formData.get('insuranceCompanyCnpj'),
      insuranceStartDate: formData.get('insuranceStartDate'),
      insuranceEndDate: formData.get('insuranceEndDate'),
    });

    if (!insuranceFile || !payloadParse.success) {
      return NextResponse.json(
        { error: 'Envie os dados do seguro e o comprovante no mesmo envio.' },
        { status: 400 }
      );
    }

    const {
      insuranceCompany,
      insurancePolicyNumber,
      insuranceCompanyCnpj,
      insuranceStartDate,
      insuranceEndDate,
    } = payloadParse.data;

    const parsedInsuranceStartDate = parseDateOnlyToUtc(insuranceStartDate);
    const parsedInsuranceEndDate = parseDateOnlyToUtc(insuranceEndDate);

    if (
      Number.isNaN(parsedInsuranceStartDate.getTime()) ||
      Number.isNaN(parsedInsuranceEndDate.getTime())
    ) {
      return NextResponse.json(
        { error: 'Datas de vigência do seguro inválidas.' },
        { status: 400 }
      );
    }

    if (parsedInsuranceEndDate < parsedInsuranceStartDate) {
      return NextResponse.json(
        { error: 'A vigência final do seguro deve ser igual ou posterior à vigência inicial.' },
        { status: 400 }
      );
    }

    const insuranceResult = await processUploadedFile(insuranceFile, internshipId, 'LIFE_INSURANCE');
    if ('error' in insuranceResult) {
      return NextResponse.json({ error: insuranceResult.error }, { status: 400 });
    }
    uploadedFileUrl = insuranceResult.file.url;

    let previousFileUrl: string | null = null;
    let replacedExistingDocument = false;

    const updatedInternship = await prisma.$transaction(async (tx) => {
      const internshipUpdated = await tx.internship.update({
        where: { id: internshipId },
        data: {
          insuranceCompany,
          insurancePolicyNumber,
          insuranceCompanyCnpj,
          insuranceStartDate: parsedInsuranceStartDate,
          insuranceEndDate: parsedInsuranceEndDate,
        },
      });

      const existingInsurance = await tx.document.findFirst({
        where: {
          internshipId,
          type: 'LIFE_INSURANCE',
        },
      });

      if (existingInsurance) {
        if (existingInsurance.status === 'APPROVED' || existingInsurance.status === 'SIGNED_VALIDATED') {
          throw new Error('INSURANCE_DOCUMENT_LOCKED');
        }

        previousFileUrl = existingInsurance.fileUrl;
        replacedExistingDocument = true;

        await tx.document.update({
          where: { id: existingInsurance.id },
          data: {
            fileUrl: insuranceResult.file.url,
            status: 'PENDING_ANALYSIS',
            rejectionComments: null,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.document.create({
          data: {
            type: 'LIFE_INSURANCE',
            fileUrl: insuranceResult.file.url,
            status: 'PENDING_ANALYSIS',
            internshipId,
          },
        });
      }

      return internshipUpdated;
    });

    if (previousFileUrl) {
      const oldFilePath = previousFileUrl.replace('/uploads/documents/', '');
      const fullPath = `${process.cwd()}/public/uploads/documents/${oldFilePath}`;
      deleteFile(fullPath);
    }

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.DOCUMENT_SUBMITTED,
          title: replacedExistingDocument ? 'Documento reenviado para analise' : 'Documento enviado para analise',
          message: replacedExistingDocument
            ? `Aluno ${internship.student.name} reenviou comprovante do Seguro de Vida para o estagio na empresa ${internship.companyName}.`
            : `Aluno ${internship.student.name} enviou comprovante do Seguro de Vida para o estagio na empresa ${internship.companyName}.`,
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

    if (error instanceof Error && error.message === 'INSURANCE_DOCUMENT_LOCKED') {
      if (uploadedFileUrl) {
        const uploadedFilename = uploadedFileUrl.replace('/uploads/documents/', '');
        const uploadedFullPath = `${process.cwd()}/public/uploads/documents/${uploadedFilename}`;
        deleteFile(uploadedFullPath);
      }

      return NextResponse.json(
        { error: 'Comprovante de seguro já aprovado/validado e não pode mais ser substituído.' },
        { status: 400 }
      );
    }

    if (uploadedFileUrl) {
      const uploadedFilename = uploadedFileUrl.replace('/uploads/documents/', '');
      const uploadedFullPath = `${process.cwd()}/public/uploads/documents/${uploadedFilename}`;
      deleteFile(uploadedFullPath);
    }

    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
