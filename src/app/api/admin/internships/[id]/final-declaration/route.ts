import { NextRequest } from 'next/server';
import {
  DocumentStatus,
  DocumentType,
  InternshipStatus,
  NotificationType,
} from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile, deleteFile } from '@/lib/file-upload';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { adminFinalDeclarationUploadSchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';
import { getFinalDocumentsPolicy } from '@/lib/final-documents-policy';

const FINAL_DECLARATION_TYPE = 'FINAL_DECLARATION' as DocumentType;
const PARECER_AVALIATIVO_TYPE = 'PARECER_AVALIATIVO' as DocumentType;

const isApprovedDocumentStatus = (status: DocumentStatus) =>
  status === DocumentStatus.APPROVED || status === DocumentStatus.SIGNED_VALIDATED;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;

    const parsedParams = adminFinalDeclarationUploadSchema.safeParse({ internshipId });
    if (!parsedParams.success) {
      return createValidationErrorResponse(parsedParams.error.flatten().fieldErrors);
    }

    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Não autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Apenas administradores podem enviar a Declaração Final', 403);
    }

    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          select: {
            name: true,
            userId: true,
          },
        },
        documents: true,
      },
    });

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    if (internship.status !== InternshipStatus.FINISHED) {
      return createErrorResponse('A Declaração Final só pode ser enviada para estágios finalizados', 400);
    }

    const finalDocumentsPolicy = getFinalDocumentsPolicy({
      earlyTerminationApproved: internship.earlyTerminationApproved,
      startDate: internship.startDate,
      endDate: internship.endDate,
      earlyTerminationRequestedAt: internship.earlyTerminationRequestedAt,
    });

    if (!finalDocumentsPolicy.requiresFinalDeclaration) {
      return createErrorResponse(
        'Declaração Final não se aplica para encerramento antecipado com duração menor que 6 meses',
        400
      );
    }

    const hasTreApproved = internship.documents.some(
      (doc) => doc.type === DocumentType.TRE && isApprovedDocumentStatus(doc.status)
    );
    const hasRfeApproved = internship.documents.some(
      (doc) => doc.type === DocumentType.RFE && isApprovedDocumentStatus(doc.status)
    );
    const hasParecerAvaliativoApproved = internship.documents.some(
      (doc) => doc.type === PARECER_AVALIATIVO_TYPE && isApprovedDocumentStatus(doc.status)
    );
    const hasTerminationTermApproved = internship.documents.some(
      (doc) => doc.type === DocumentType.TERMINATION_TERM && isApprovedDocumentStatus(doc.status)
    );

    if (
      finalDocumentsPolicy.requiresCoreFinalDocuments &&
      (!hasTreApproved || !hasRfeApproved || !hasParecerAvaliativoApproved)
    ) {
      return createErrorResponse(
        'TRE, RFE e Parecer Avaliativo devem estar aprovados antes do envio da Declaração Final',
        400
      );
    }

    if (finalDocumentsPolicy.requiresTerminationTerm && !hasTerminationTermApproved) {
      return createErrorResponse(
        'O Termo de Cancelamento deve estar aprovado antes do envio da Declaração Final',
        400
      );
    }

    const formData = await request.formData();
    const fileField = formData.get('file') as File | null;

    if (!fileField || !(fileField instanceof File)) {
      return createErrorResponse('Nenhum arquivo foi enviado', 400);
    }

    const uploadResult = await processUploadedFile(fileField, internshipId, FINAL_DECLARATION_TYPE);

    if ('error' in uploadResult) {
      return createErrorResponse(uploadResult.error, 400);
    }

    const { file } = uploadResult;

    const existingDeclaration = await prisma.document.findFirst({
      where: {
        internshipId,
        type: FINAL_DECLARATION_TYPE,
      },
      orderBy: { updatedAt: 'desc' },
    });

    let document;

    if (existingDeclaration) {
      if (existingDeclaration.fileUrl) {
        const oldFilePath = existingDeclaration.fileUrl.replace('/uploads/documents/', '');
        const fullPath = `${process.cwd()}/public/uploads/documents/${oldFilePath}`;
        deleteFile(fullPath);
      }

      document = await prisma.document.update({
        where: { id: existingDeclaration.id },
        data: {
          fileUrl: file.url,
          status: DocumentStatus.APPROVED,
          rejectionComments: null,
          updatedAt: new Date(),
        },
      });
    } else {
      document = await prisma.document.create({
        data: {
          internshipId,
          type: FINAL_DECLARATION_TYPE,
          fileUrl: file.url,
          status: DocumentStatus.APPROVED,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: internship.student.userId,
        type: NotificationType.DOCUMENT_STATUS,
        title: 'Declaração Final disponível',
        message: `A Agência de Oportunidades enviou a Declaração Final do estágio na empresa ${internship.companyName}.`,
        href: `/dashboard/internships/${internship.id}`,
      },
    });

    return createSuccessResponse(
      {
        message: existingDeclaration
          ? 'Declaração Final atualizada com sucesso'
          : 'Declaração Final enviada com sucesso',
        document,
      },
      existingDeclaration ? 200 : 201
    );
  } catch (error: unknown) {
    console.error('Erro ao enviar Declaração Final:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse('Erro ao enviar Declaração Final', 500);
  }
}
