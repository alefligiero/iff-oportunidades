import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { generatePeriodicReportsSchedule } from '@/lib/periodic-reports';

/**
 * GET /api/internships/[id]/periodic-reports-schedule
 * Retorna o cronograma de relatórios periódicos do estágio
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

    // Buscar estágio com documentos
    const internship = await prisma.internship.findUnique({
      where: { id: internshipId },
      include: {
        student: {
          select: {
            userId: true,
            name: true,
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
          orderBy: {
            createdAt: 'asc',
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

    // Gerar schedule usando a biblioteca
    const schedule = generatePeriodicReportsSchedule(
      internship.startDate,
      internship.endDate,
      internship.documents
    );

    return createSuccessResponse({
      schedule,
      internshipInfo: {
        id: internship.id,
        status: internship.status,
        type: internship.type,
        startDate: internship.startDate,
        endDate: internship.endDate,
        studentName: internship.student.name,
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar schedule de relatórios periódicos:', error);

    if (error instanceof Error && error.message.includes('Token')) {
      return createErrorResponse('Token inválido ou expirado', 401);
    }

    return createErrorResponse('Erro ao buscar cronograma de relatórios', 500);
  }
}
