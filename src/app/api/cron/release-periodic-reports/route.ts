import { NextRequest } from 'next/server';
import { InternshipStatus, NotificationType } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { generateReportPeriods, requiresPeriodicReports } from '@/lib/periodic-reports';
import { startOfDay, isSameDay } from 'date-fns';
import { getTodayBRT } from '@/lib/date-utils';

/**
 * GET /api/cron/release-periodic-reports
 * Verifica estágios em andamento que requerem relatórios periódicos e,
 * para cada período que abre sua janela de envio hoje (availableDate == hoje),
 * cria uma notificação para o aluno caso ainda não exista.
 *
 * Esta rota deve ser chamada por um cron job diariamente.
 * IMPORTANTE: Em produção, proteger com CRON_SECRET ou usar o serviço de cron do Vercel.
 */
export async function GET(request: NextRequest) {
  try {
    // Validação de autenticação via CRON_SECRET
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return createErrorResponse('Não autorizado', 401);
    }

    const today = getTodayBRT();
    const todayStart = startOfDay(today);

    // Buscar todos os estágios em andamento com dados do aluno
    const activeInternships = await prisma.internship.findMany({
      where: {
        status: InternshipStatus.IN_PROGRESS,
      },
      include: {
        student: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });

    const notifiedInternships: string[] = [];
    const skippedInternships: string[] = [];

    for (const internship of activeInternships) {
      // Verificar se o estágio tem duração suficiente para relatórios periódicos
      if (!requiresPeriodicReports(internship.startDate, internship.endDate)) {
        continue;
      }

      // Gerar os períodos de relatório para este estágio
      const periods = generateReportPeriods(internship.startDate, internship.endDate, today);

      for (const period of periods) {
        const availableDate = startOfDay(period.availableDate);

        // Verificar se o período abre hoje
        if (!isSameDay(availableDate, todayStart)) {
          continue;
        }

        // Verificar se já existe uma notificação para este período (idempotência)
        const notificationHref = `/dashboard/internships/${internship.id}`;
        const periodMarker = `[período ${period.periodNumber}]`;

        const existing = await prisma.notification.findFirst({
          where: {
            userId: internship.student.userId,
            type: NotificationType.DOCUMENT_STATUS,
            href: notificationHref,
            message: {
              contains: periodMarker,
            },
            // Limitar a notificações criadas no mesmo dia (idempotência por dia)
            createdAt: {
              gte: todayStart,
            },
          },
        });

        if (existing) {
          skippedInternships.push(internship.id);
          continue;
        }

        // Criar notificação para o aluno
        await prisma.notification.create({
          data: {
            userId: internship.student.userId,
            type: NotificationType.DOCUMENT_STATUS,
            title: `Relatório Periódico ${period.periodNumber} disponível`,
            message: `O envio do seu relatório periódico ${periodMarker} está disponível. Prazo para entrega: ${period.dueDate.toLocaleDateString('pt-BR')}. Acesse o portal para realizar o envio.`,
            href: notificationHref,
          },
        });

        notifiedInternships.push(internship.id);
      }
    }

    return createSuccessResponse(
      {
        message: `${notifiedInternships.length} notificação(ões) de relatório periódico enviada(s)`,
        notifiedInternships,
        skippedCount: skippedInternships.length,
        checkedCount: activeInternships.length,
      },
      200
    );
  } catch (error: unknown) {
    console.error('Erro ao processar cron job de liberação de relatórios periódicos:', error);
    return createErrorResponse('Erro ao processar cron job', 500);
  }
}
