import { NextRequest } from 'next/server';
import { DocumentType } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { processUploadedFile, deleteFile } from '@/lib/file-upload';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

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
          select: { userId: true },
        },
      },
    });

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    // Apenas o aluno dono ou admin pode fazer upload
    if (userPayload.role !== 'ADMIN' && internship.student.userId !== userPayload.userId) {
      return createErrorResponse('Você não tem permissão para enviar documentos para este estágio', 403);
    }

    // Obter tipo de documento e arquivo do FormData (leitura única)
    const formData = await request.formData();
    const documentType = formData.get('type') as string;
    const fileField = formData.get('file') as File | null;

    if (!documentType) {
      return createErrorResponse('Tipo de documento é obrigatório', 400);
    }

    if (!fileField || !(fileField instanceof File)) {
      return createErrorResponse('Nenhum arquivo foi enviado', 400);
    }

    // Validar tipo de documento
    if (!Object.values(DocumentType).includes(documentType as DocumentType)) {
      return createErrorResponse('Tipo de documento inválido', 400);
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

    // Verificar se já existe documento deste tipo (para substituir)
    const existingDocument = await prisma.document.findFirst({
      where: {
        internshipId,
        type: documentType as DocumentType,
      },
    });

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
        type: documentType as DocumentType,
        fileUrl: file.url,
        status: 'PENDING_ANALYSIS',
        internshipId,
      },
    });

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
