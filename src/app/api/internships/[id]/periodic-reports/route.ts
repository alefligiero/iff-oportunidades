import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { processUploadedFile } from '@/lib/file-upload';
import { DocumentType, DocumentStatus } from '@prisma/client';

/**
 * POST /api/internships/[id]/periodic-reports
 * Aluno envia um relatório periódico para análise
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: internshipId } = await params;

    // Autenticação
    const userPayload = await getUserFromToken(request);
    if (!userPayload || userPayload.role !== 'STUDENT') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Verificar se o estágio existe e pertence ao aluno
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

    if (internship.student.userId !== userPayload.userId) {
      return createErrorResponse('Sem permissão para acessar este estágio', 403);
    }

    // Processar FormData
    const formData = await request.formData();
    const reportFile = formData.get('report') as File | null;

    if (!reportFile) {
      return createErrorResponse('Arquivo do relatório não fornecido', 400);
    }

    // Validar arquivo
    const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedMimeTypes.includes(reportFile.type)) {
      return createErrorResponse('Apenas PDFs e documentos Word são aceitos', 400);
    }

    const maxFileSize = 10 * 1024 * 1024; // 10MB
    if (reportFile.size > maxFileSize) {
      return createErrorResponse('Arquivo muito grande (máximo 10MB)', 400);
    }

    // Upload do arquivo
    const uploadResult = await processUploadedFile(reportFile, internshipId, DocumentType.PERIODIC_REPORT);
    if ('error' in uploadResult) {
      return createErrorResponse(uploadResult.error, 400);
    }

    // Criar documento
    const document = await prisma.document.create({
      data: {
        type: DocumentType.PERIODIC_REPORT,
        fileUrl: uploadResult.file.url,
        status: DocumentStatus.PENDING_ANALYSIS,
        internshipId,
      },
    });

    return createSuccessResponse({
      document: {
        id: document.id,
        type: document.type,
        status: document.status,
        fileUrl: document.fileUrl,
      },
      message: 'Relatório periódico enviado com sucesso. Aguarde a análise do administrador.',
    }, 201);

  } catch (error: unknown) {
    console.error('Erro ao enviar relatório periódico:', error);
    
    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse('Token inválido ou expirado', 401);
    }

    return createErrorResponse('Erro ao enviar relatório periódico', 500);
  }
}
