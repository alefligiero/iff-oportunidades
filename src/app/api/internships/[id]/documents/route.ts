import { NextRequest } from 'next/server';
import { DocumentType, NotificationType, Role } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile, deleteFile } from '@/lib/file-upload';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { documentUploadTypeSchema } from '@/lib/validations/schemas';
import { getFinalDocumentsPolicy } from '@/lib/final-documents-policy';

/**
 * POST /api/internships/[id]/documents
 * Upload de documento para um estágio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;

    // Autenticação
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Verificar se estágio existe e pertence ao aluno
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          select: { userId: true, name: true },
        },
      },
    });

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    // Bloquear envio se estágio foi cancelado
    if (internship.status === 'CANCELED') {
      return createErrorResponse('Não é possível enviar documentos para um estágio cancelado', 400);
    }

    // Apenas o aluno dono ou admin pode fazer upload
    if (userPayload.role !== 'ADMIN' && internship.student.userId !== userPayload.userId) {
      return createErrorResponse('Você não tem permissão para enviar documentos para este estágio', 403);
    }

    // Obter tipo de documento e arquivo do FormData (leitura única)
    const formData = await request.formData();
    const rawDocumentType = formData.get('type');
    const fileField = formData.get('file') as File | null;

    if (!rawDocumentType || typeof rawDocumentType !== 'string') {
      return createErrorResponse('Tipo de documento é obrigatório', 400);
    }

    const parsedDocumentType = documentUploadTypeSchema.safeParse({ type: rawDocumentType });
    if (!parsedDocumentType.success) {
      return createErrorResponse('Tipo de documento inválido', 400);
    }

    const documentType = parsedDocumentType.data.type;

    if (!fileField || !(fileField instanceof File)) {
      return createErrorResponse('Nenhum arquivo foi enviado', 400);
    }

    if (documentType === DocumentType.FINAL_DECLARATION) {
      return createErrorResponse(
        'A Declaração Final deve ser enviada pelo Admin no painel administrativo',
        403
      );
    }

    const finalDocumentsPolicy = getFinalDocumentsPolicy({
      earlyTerminationApproved: internship.earlyTerminationApproved,
      startDate: internship.startDate,
      endDate: internship.endDate,
      earlyTerminationRequestedAt: internship.earlyTerminationRequestedAt,
    });

    if (
      !finalDocumentsPolicy.requiresCoreFinalDocuments &&
      ([DocumentType.TRE, DocumentType.RFE, DocumentType.PARECER_AVALIATIVO] as DocumentType[]).includes(documentType)
    ) {
      return createErrorResponse(
        'Para encerramento antecipado com duração menor que 6 meses, apenas o Termo de Cancelamento é aceito',
        400
      );
    }

    if (documentType === DocumentType.TERMINATION_TERM && !finalDocumentsPolicy.requiresTerminationTerm) {
      return createErrorResponse(
        'O Termo de Cancelamento só pode ser enviado quando houver encerramento antecipado aprovado',
        400
      );
    }

    if (documentType === DocumentType.EXTENSION_TERM && internship.internshipExtensionApproved !== true) {
      return createErrorResponse(
        'O Termo Aditivo só pode ser enviado após a prorrogação ser aprovada pela Agência',
        400
      );
    }

    if (documentType === DocumentType.LIFE_INSURANCE) {
      const hasAllInsuranceData = Boolean(
        internship.insuranceCompany &&
        internship.insurancePolicyNumber &&
        internship.insuranceCompanyCnpj &&
        internship.insuranceStartDate &&
        internship.insuranceEndDate
      );

      if (!hasAllInsuranceData) {
        return createErrorResponse(
          'Preencha os dados do seguro antes de enviar o comprovante.',
          400
        );
      }
    }

    const documentLabels: Record<DocumentType, string> = {
      TCE: 'TCE',
      PAE: 'PAE',
      PERIODIC_REPORT: 'Relatorio Periodico',
      TRE: 'TRE',
      RFE: 'RFE',
      PARECER_AVALIATIVO: 'Parecer Avaliativo',
      TERMINATION_TERM: 'Termo de Cancelamento',
      EXTENSION_TERM: 'Termo Aditivo de Prorrogação',
      FINAL_DECLARATION: 'Declaração Final',
      SIGNED_CONTRACT: 'TCE + PAE assinados',
      LIFE_INSURANCE: 'comprovante do Seguro de Vida',
    };

    const documentLabel = documentLabels[documentType as DocumentType] ?? documentType;

    // Verificar se já existe documento deste tipo (para substituir)
    const existingDocument = await prisma.document.findFirst({
      where: {
        internshipId,
        type: documentType,
      },
    });

    if (
      existingDocument &&
      (existingDocument.status === 'APPROVED' || existingDocument.status === 'SIGNED_VALIDATED')
    ) {
      return createErrorResponse('Documento já aprovado/validado e não pode mais ser substituído', 400);
    }

    // Processar upload do arquivo
    const result = await processUploadedFile(
      fileField,
      internshipId,
      documentType
    );

    // Verificar se houve erro no upload
    if ('error' in result) {
      return createErrorResponse(result.error, 400);
    }

    const { file } = result;

    // Se existe documento anterior, deletar arquivo antigo e atualizar registro
    if (existingDocument) {
      // Deletar arquivo antigo se existir
      if (existingDocument.fileUrl) {
        const oldFilePath = existingDocument.fileUrl.replace('/uploads/documents/', '');
        const fullPath = `${process.cwd()}/public/uploads/documents/${oldFilePath}`;
        deleteFile(fullPath);
      }

      // Atualizar documento existente
      const updatedDocument = await prisma.document.update({
        where: { id: existingDocument.id },
        data: {
          fileUrl: file.url,
          status: 'PENDING_ANALYSIS', // Resetar status ao reenviar
          rejectionComments: null, // Limpar comentários de rejeição
          updatedAt: new Date(),
        },
      });

      if (userPayload.role !== Role.ADMIN) {
        const admins = await prisma.user.findMany({
          where: { role: Role.ADMIN },
          select: { id: true },
        });

        if (admins.length > 0) {
          await prisma.notification.createMany({
            data: admins.map((admin) => ({
              userId: admin.id,
              type: NotificationType.DOCUMENT_SUBMITTED,
              title: 'Documento reenviado para analise',
              message: `Aluno ${internship.student.name} reenviou ${documentLabel} para o estagio na empresa ${internship.companyName}.`,
              href: `/dashboard/admin/internships/${internship.id}`,
            })),
          });
        }
      }

      return createSuccessResponse(
        {
          message: 'Documento reenviado com sucesso',
          document: updatedDocument,
        },
        200
      );
    }

    // Criar novo documento
    const newDocument = await prisma.document.create({
      data: {
        type: documentType,
        fileUrl: file.url,
        status: 'PENDING_ANALYSIS',
        internshipId,
      },
    });

    if (userPayload.role !== Role.ADMIN) {
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
            message: `Aluno ${internship.student.name} enviou ${documentLabel} para o estagio na empresa ${internship.companyName}.`,
            href: `/dashboard/admin/internships/${internship.id}`,
          })),
        });
      }
    }

    return createSuccessResponse(
      {
        message: 'Documento enviado com sucesso',
        document: newDocument,
      },
      201
    );
  } catch (error: unknown) {
    console.error('Erro ao fazer upload de documento:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse('Erro ao processar upload do documento', 500);
  }
}

/**
 * GET /api/internships/[id]/documents
 * Listar documentos de um estágio
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;

    // Autenticação
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Verificar se estágio existe
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          select: { userId: true },
        },
      },
    });

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    // Apenas o aluno dono ou admin pode ver documentos
    if (userPayload.role !== 'ADMIN' && internship.student.userId !== userPayload.userId) {
      return createErrorResponse('Você não tem permissão para visualizar documentos deste estágio', 403);
    }

    // Obter filtro de tipo (opcional)
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    // Buscar documentos
    const documents = await prisma.document.findMany({
      where: {
        internshipId,
        ...(typeFilter && { type: typeFilter as DocumentType }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return createSuccessResponse({ documents });
  } catch (error: unknown) {
    console.error('Erro ao listar documentos:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse('Erro ao listar documentos', 500);
  }
}
