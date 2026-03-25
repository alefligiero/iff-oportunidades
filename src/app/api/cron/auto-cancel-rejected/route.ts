import { NextRequest } from 'next/server';
import { InternshipStatus, VacancyStatus } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/auto-cancel-rejected
 * Cancela automaticamente vagas e estágios que permanecem no status REJECTED
 * por mais de 7 dias sem correções, movendo-os para CLOSED_BY_ADMIN / CANCELED.
 *
 * Consolida a lógica existente em:
 *   - /api/admin/vacancies/auto-close (POST)
 *   - /api/admin/internships/auto-cancel (POST)
 *
 * Esta rota deve ser chamada por um cron job diariamente.
 * IMPORTANTE: Em produção, proteger com CRON_SECRET ou usar o serviço de cron do Vercel.
 */

const DAYS_THRESHOLD = 7;
const VACANCY_CLOSURE_NOTE = 'Fechada automaticamente após 7 dias em rejeitada sem correções.';
const INTERNSHIP_CANCEL_NOTE = 'Cancelado automaticamente após 7 dias em recusado sem correções.';

export async function GET(request: NextRequest) {
  try {
    // Validação de autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return createErrorResponse('Não autorizado', 401);
    }

    const cutoffDate = new Date(Date.now() - DAYS_THRESHOLD * 24 * 60 * 60 * 1000);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. Vagas rejeitadas há mais de 7 dias → CLOSED_BY_ADMIN
    // ──────────────────────────────────────────────────────────────────────────
    const vacanciesToClose = await prisma.jobVacancy.findMany({
      where: {
        status: VacancyStatus.REJECTED,
        updatedAt: {
          lte: cutoffDate,
        },
      },
      select: { id: true },
    });

    const vacancyUpdates = vacanciesToClose.map((vacancy) =>
      prisma.jobVacancy.update({
        where: { id: vacancy.id },
        data: {
          status: VacancyStatus.CLOSED_BY_ADMIN,
          closureReason: VACANCY_CLOSURE_NOTE,
        },
      })
    );

    await prisma.$transaction(vacancyUpdates);

    // ──────────────────────────────────────────────────────────────────────────
    // 2. Estágios rejeitados há mais de 7 dias → CANCELED
    // ──────────────────────────────────────────────────────────────────────────
    const internshipsToCancel = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.REJECTED,
        rejectedAt: {
          not: null,
          lte: cutoffDate,
        },
      },
      select: { id: true, rejectionReason: true },
    });

    const internshipUpdates = internshipsToCancel.map((internship) => {
      const reason = internship.rejectionReason
        ? `${internship.rejectionReason}\n\n${INTERNSHIP_CANCEL_NOTE}`
        : INTERNSHIP_CANCEL_NOTE;

      return prisma.internship.update({
        where: { id: internship.id },
        data: {
          status: InternshipStatus.CANCELED,
          rejectionReason: reason,
        },
      });
    });

    await prisma.$transaction(internshipUpdates);

    return createSuccessResponse(
      {
        message: `${vacanciesToClose.length} vaga(s) fechada(s) e ${internshipsToCancel.length} estágio(s) cancelado(s) automaticamente`,
        vacanciesClosed: vacanciesToClose.map((v) => v.id),
        internshipsCanceled: internshipsToCancel.map((i) => i.id),
        vacanciesClosedCount: vacanciesToClose.length,
        internshipsCanceledCount: internshipsToCancel.length,
        cutoffDate: cutoffDate.toISOString(),
        daysThreshold: DAYS_THRESHOLD,
      },
      200
    );
  } catch (error: unknown) {
    console.error('Erro ao processar cron job de cancelamento de rejeitados:', error);
    return createErrorResponse('Erro ao processar cron job', 500);
  }
}
