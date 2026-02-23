import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { generatePeriodicReportsSchedule } from '@/lib/periodic-reports';
import { addDays, isBefore, startOfDay } from 'date-fns';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * GET /api/internships/[id]/periodic-report-template
 * Download do modelo de relatório periódico
 * Apenas disponível 30 dias antes do vencimento
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

    // Query param: período (1, 2, 3...)
    const periodNumberQuery = request.nextUrl.searchParams.get('period');
    if (!periodNumberQuery) {
      return createErrorResponse('Parâmetro "period" obrigatório', 400);
    }

    const periodNumber = parseInt(periodNumberQuery, 10);
    if (isNaN(periodNumber) || periodNumber < 1) {
      return createErrorResponse('Número do período inválido', 400);
    }

    // Buscar estágio
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          select: {
            userId: true,
            name: true,
            matricula: true,
          },
        },
        documents: {
          select: {
            id: true,
            type: true,
            status: true,
            fileUrl: true,
            createdAt: true,
            rejectionComments: true,
          },
        },
      },
    });

    if (!internship) {
      return createErrorResponse('Estágio não encontrado', 404);
    }

    // Verificação de permissão: apenas o aluno dono ou admin
    if (userPayload.role !== 'ADMIN' && userPayload.userId !== internship.student.userId) {
      return createErrorResponse('Sem permissão para acessar este estágio', 403);
    }

    // Gerar cronograma
    const schedule = generatePeriodicReportsSchedule(
      internship.startDate,
      internship.endDate,
      internship.documents
    );

    // Se não requer relatórios, retornar erro
    if (!schedule.requiresReports) {
      return createErrorResponse(
        'Este estágio não requer relatórios periódicos',
        400
      );
    }

    // Buscar o período solicitado
    const period = schedule.periods.find((p) => p.periodNumber === periodNumber);
    if (!period) {
      return createErrorResponse('Período não encontrado', 404);
    }

    // Verificar se está disponível
    if (!period.isAvailable) {
      return createErrorResponse(
        `Modelo disponível a partir de ${new Date(period.availableDate).toLocaleDateString(
          'pt-BR'
        )}`,
        400
      );
    }

    // Ler arquivo do modelo (deve estar em public/templates/)
    const templatePath = join(
      process.cwd(),
      'public/templates/modelo-relatorio-periodico.pdf'
    );

    let fileBuffer: Buffer;
    try {
      fileBuffer = readFileSync(templatePath);
    } catch (err) {
      console.error('Erro ao ler arquivo de modelo:', err);
      return createErrorResponse('Modelo não encontrado no servidor', 500);
    }

    // Retornar arquivo
    return new Response(Buffer.from(fileBuffer) as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="modelo-relatorio-periodico-${periodNumber}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar modelo de relatório:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse('Token inválido ou expirado', 401);
    }

    return createErrorResponse('Erro ao baixar modelo', 500);
  }
}
