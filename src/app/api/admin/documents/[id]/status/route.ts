import { NextRequest } from 'next/server';
import { DocumentStatus, DocumentType, InternshipStatus } from '@prisma/client';
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
 * Verifica se todos os documentos necessários foram aprovados e inicia o estágio automaticamente
 * Documentos necessários: SIGNED_CONTRACT (TCE + PAE assinados) e LIFE_INSURANCE (Comprovante de Seguro)
 */
async function checkAndStartInternshipIfReady(internshipId: string): Promise<void> {
  // Buscar todos os documentos do estágio
  const documents = await prisma.document.findMany({
    where: { internshipId },
  });

  // Verificar se SIGNED_CONTRACT está aprovado
  const hasSignedContractApproved = documents.some(
    (doc) => doc.type === DocumentType.SIGNED_CONTRACT && doc.status === DocumentStatus.APPROVED
  );

  // Verificar se LIFE_INSURANCE está aprovado
  const hasLifeInsuranceApproved = documents.some(
    (doc) => doc.type === DocumentType.LIFE_INSURANCE && doc.status === DocumentStatus.APPROVED
  );

  // Se ambos estão aprovados, verificar o status do estágio
  if (hasSignedContractApproved && hasLifeInsuranceApproved) {
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      select: { status: true, startDate: true },
    });

    // Se estágio está aprovado (aguardando documentos), verificar data de início
    if (internship?.status === InternshipStatus.APPROVED) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const startDate = new Date(internship.startDate);
      startDate.setHours(0, 0, 0, 0);

      // Verificar se a data de início já chegou
      if (startDate <= today) {
        // Data de início já chegou ou é hoje - iniciar estágio
        await prisma.internship.update({
          where: { id: internshipId },
          data: {
            status: InternshipStatus.IN_PROGRESS,
            updatedAt: new Date(),
          },
        });

        console.log(`✅ Estágio ${internshipId} iniciado automaticamente`);
      }
    }
  }
}

/**
 * PATCH /api/admin/documents/[id]/status
 * Aprovar ou rejeitar documento (apenas admin)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

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

    // Se documento foi aprovado, verificar se estágio pode iniciar automaticamente
    if (status === 'APPROVED') {
      await checkAndStartInternshipIfReady(document.internshipId);
    }

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
