import { NextRequest } from 'next/server';
import { DocumentStatus } from '@prisma/client';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api-response';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schema de validação para atualização de status
const updateDocumentStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED'], {
    message: 'Status deve ser APPROVED ou REJECTED',
  }),
  rejectionComments: z.string().optional(),
});

/**
 * PATCH /api/admin/documents/[id]/status
 * Aprovar ou rejeitar documento (apenas admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Autenticação e verificação de admin
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Não autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Apenas administradores podem aprovar/rejeitar documentos', 403);
    }

    // Validar body
    const body = await request.json();
    const validation = updateDocumentStatusSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const { status, rejectionComments } = validation.data;

    // Se rejeitando, comentário é obrigatório
    if (status === 'REJECTED' && (!rejectionComments || rejectionComments.trim().length === 0)) {
      return createErrorResponse('Comentário de rejeição é obrigatório ao rejeitar documento', 400);
    }

    // Buscar documento
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        internship: {
          include: {
            student: {
              select: {
                name: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return createErrorResponse('Documento não encontrado', 404);
    }

    // Atualizar documento
    const updatedDocument = await prisma.document.update({
      where: { id: documentId },
      data: {
        status: status as DocumentStatus,
        rejectionComments: status === 'REJECTED' ? rejectionComments : null,
        updatedAt: new Date(),
      },
    });

    // TODO: Implementar notificação ao aluno
    // await createNotification({
    //   userId: document.internship.student.userId,
    //   type: status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
    //   message: `Documento ${document.type} foi ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'}`,
    // });

    return createSuccessResponse({
      message: `Documento ${status === 'APPROVED' ? 'aprovado' : 'rejeitado'} com sucesso`,
      document: updatedDocument,
    });
  } catch (error: unknown) {
    console.error('Erro ao atualizar status do documento:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse(error.message, 401);
    }

    return createErrorResponse('Erro ao atualizar status do documento', 500);
  }
}
