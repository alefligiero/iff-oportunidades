import { NextRequest } from 'next/server';
import { InternshipStatus } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/finish-internships
 * Verifica estágios em andamento cuja data de fim já chegou e os finaliza automaticamente
 * Também finaliza estágios com encerramento precoce aprovado que ainda não foram marcados como finalizados
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
    today.setHours(23, 59, 59, 999); // Fim do dia

    // Buscar todos os estágios em andamento que devem ser finalizados
    const internshipsToFinish = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.IN_PROGRESS,
        OR: [
          {
            // Data de fim já chegou
            endDate: {
              lte: today,
            },
          },
          {
            // Encerramento precoce aprovado
            earlyTerminationApproved: true,
          },
        ],
      },
    });

    const updatedInternships: string[] = [];

    // Atualizar todos os estágios para FINISHED
    for (const internship of internshipsToFinish) {
      await prisma.internship.update({
        where: { id: internship.id },
        data: {
          status: InternshipStatus.FINISHED,
          updatedAt: new Date(),
        },
      });

      updatedInternships.push(internship.id);
    }

    return createSuccessResponse(
      {
        message: `${updatedInternships.length} estágio(s) finalizado(s) automaticamente`,
        internships: updatedInternships,
        checkedCount: internshipsToFinish.length,
      },
      200
    );
  } catch (error: unknown) {
    console.error('Erro ao processar cron job de finalização de estágios:', error);
    return createErrorResponse('Erro ao processar cron job', 500);
  }
}
