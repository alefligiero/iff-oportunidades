import { NextRequest } from 'next/server';
import { InternshipStatus, DocumentStatus, DocumentType } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/start-internships
 * Verifica estágios aprovados com documentos prontos e cuja data de início já chegou
 * Esta rota deve ser chamada por um cron job diariamente
 * 
 * IMPORTANTE: Em produção, proteger com um token secreto ou usar o serviço de cron do Vercel
 */
export async function GET(request: NextRequest) {
  try {
    // Em produção, validar um token de autenticação para cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return createErrorResponse('Não autorizado', 401);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar todos os estágios aprovados
    const approvedInternships = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.APPROVED,
        startDate: {
          lte: today, // Data de início <= hoje
        },
      },
      include: {
        documents: true,
      },
    });

    const updatedInternships: string[] = [];

    // Para cada estágio aprovado, verificar se os documentos necessários estão aprovados
    for (const internship of approvedInternships) {
      const hasSignedContractApproved = internship.documents.some(
        (doc) => doc.type === DocumentType.SIGNED_CONTRACT && doc.status === DocumentStatus.APPROVED
      );

      const hasLifeInsuranceApproved = internship.documents.some(
        (doc) => doc.type === DocumentType.LIFE_INSURANCE && doc.status === DocumentStatus.APPROVED
      );
      const insuranceRequirementMet = !(internship as { insuranceRequired?: boolean }).insuranceRequired || hasLifeInsuranceApproved;

      // Se ambos os documentos estão aprovados, iniciar o estágio
      if (hasSignedContractApproved && insuranceRequirementMet) {
        await prisma.internship.update({
          where: { id: internship.id },
          data: {
            status: InternshipStatus.IN_PROGRESS,
            updatedAt: new Date(),
          },
        });

        updatedInternships.push(internship.id);
      }
    }

    return createSuccessResponse(
      {
        message: `${updatedInternships.length} estágio(s) iniciado(s) automaticamente`,
        internships: updatedInternships,
        checkedCount: approvedInternships.length,
      },
      200
    );
  } catch (error: unknown) {
    console.error('Erro ao processar cron job de início de estágios:', error);
    return createErrorResponse('Erro ao processar cron job', 500);
  }
}
