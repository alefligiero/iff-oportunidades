import { NextRequest } from 'next/server';
import { InternshipStatus, DocumentStatus, DocumentType } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/start-internships
 * Verifica estágios elegíveis pela data de início para iniciar automaticamente
 * ou cancelar quando houver pendências
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

    // Buscar todos os estágios elegíveis pela data de início
    const internshipsToProcess = await prisma.internship.findMany({
      where: {
        status: {
          in: [InternshipStatus.APPROVED, InternshipStatus.IN_ANALYSIS],
        },
        startDate: {
          lte: today, // Data de início <= hoje
        },
      },
      include: {
        documents: true,
      },
    });

    const startedInternships: string[] = [];
    const canceledInternships: { id: string; reason: string }[] = [];

    // Para cada estágio elegível, verificar se pode iniciar ou deve ser cancelado
    for (const internship of internshipsToProcess) {
      const signedContract = internship.documents.find(
        (doc) => doc.type === DocumentType.SIGNED_CONTRACT
      );
      const lifeInsurance = internship.documents.find(
        (doc) => doc.type === DocumentType.LIFE_INSURANCE
      );

      const hasSignedContractApproved = signedContract?.status === DocumentStatus.APPROVED;
      const hasLifeInsuranceApproved = lifeInsurance?.status === DocumentStatus.APPROVED;
      const insuranceRequired = (internship as { insuranceRequired?: boolean }).insuranceRequired === true;
      const insuranceRequirementMet = !insuranceRequired || hasLifeInsuranceApproved;

      const pendencies: string[] = [];

      if (internship.status === InternshipStatus.IN_ANALYSIS) {
        pendencies.push('Estágio permaneceu em análise até a data de início');
      }

      if (!signedContract) {
        pendencies.push('SIGNED_CONTRACT ausente');
      } else if (signedContract.status === DocumentStatus.PENDING_ANALYSIS) {
        pendencies.push('SIGNED_CONTRACT em análise');
      } else if (signedContract.status === DocumentStatus.REJECTED) {
        pendencies.push('SIGNED_CONTRACT rejeitado');
      } else if (signedContract.status !== DocumentStatus.APPROVED) {
        pendencies.push(`SIGNED_CONTRACT com status ${signedContract.status}`);
      }

      if (insuranceRequired) {
        if (!lifeInsurance) {
          pendencies.push('LIFE_INSURANCE ausente');
        } else if (lifeInsurance.status === DocumentStatus.PENDING_ANALYSIS) {
          pendencies.push('LIFE_INSURANCE em análise');
        } else if (lifeInsurance.status === DocumentStatus.REJECTED) {
          pendencies.push('LIFE_INSURANCE rejeitado');
        } else if (lifeInsurance.status !== DocumentStatus.APPROVED) {
          pendencies.push(`LIFE_INSURANCE com status ${lifeInsurance.status}`);
        }
      }

      // Se documentos obrigatórios estão aprovados, iniciar o estágio.
      // Caso contrário, cancelar com motivo detalhado.
      if (internship.status === InternshipStatus.APPROVED && hasSignedContractApproved && insuranceRequirementMet) {
        await prisma.internship.update({
          where: { id: internship.id },
          data: {
            status: InternshipStatus.IN_PROGRESS,
            updatedAt: new Date(),
          },
        });

        startedInternships.push(internship.id);
        continue;
      }

      const reason = `Cancelado automaticamente na data de início por pendências: ${pendencies.join('; ')}.`;
      const combinedReason = internship.rejectionReason
        ? `${internship.rejectionReason}\n\n${reason}`
        : reason;

      await prisma.internship.update({
        where: { id: internship.id },
        data: {
          status: InternshipStatus.CANCELED,
          rejectionReason: combinedReason,
          rejectedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      canceledInternships.push({ id: internship.id, reason });
    }

    return createSuccessResponse(
      {
        message: `${startedInternships.length} estágio(s) iniciado(s) automaticamente e ${canceledInternships.length} cancelado(s) por pendências`,
        internships: startedInternships,
        canceledInternships,
        startedCount: startedInternships.length,
        canceledCount: canceledInternships.length,
        checkedCount: internshipsToProcess.length,
      },
      200
    );
  } catch (error: unknown) {
    console.error('Erro ao processar cron job de início de estágios:', error);
    return createErrorResponse('Erro ao processar cron job', 500);
  }
}
