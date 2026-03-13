import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

const updateCourseSchema = z.object({
  name: z.string().min(3, 'Nome do curso deve ter pelo menos 3 caracteres.').max(120, 'Nome do curso muito longo.').optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const { code } = await params;
    const body = await request.json();
    const validation = updateCourseSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    if (validation.data.name === undefined && validation.data.isActive === undefined) {
      return createErrorResponse('Nenhuma alteracao enviada.', 400);
    }

    const [existing] = await prisma.$queryRaw<Array<{ code: string }>>`
      SELECT "code" FROM "AvailableCourse" WHERE "code" = ${code} LIMIT 1
    `;
    if (!existing) {
      return createErrorResponse('Curso nao encontrado.', 404);
    }

    const [updated] = await prisma.$queryRaw<Array<{ code: string; name: string; isActive: boolean }>>`
      UPDATE "AvailableCourse"
      SET
        "name" = COALESCE(${validation.data.name?.trim() ?? null}, "name"),
        "isActive" = COALESCE(${validation.data.isActive ?? null}, "isActive"),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "code" = ${code}
      RETURNING "code", "name", "isActive"
    `;

    return createSuccessResponse(updated);
  } catch (error) {
    console.error('Erro ao atualizar curso:', error);
    if (error instanceof Error && error.message.includes('AvailableCourse_name_key')) {
      return createErrorResponse('Ja existe um curso com esse nome.', 409);
    }
    return createErrorResponse('Erro ao atualizar curso.', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const { code } = await params;

    const [existing] = await prisma.$queryRaw<Array<{ code: string }>>`
      SELECT "code" FROM "AvailableCourse" WHERE "code" = ${code} LIMIT 1
    `;
    if (!existing) {
      return createErrorResponse('Curso nao encontrado.', 404);
    }

    const [updated] = await prisma.$queryRaw<Array<{ code: string; name: string; isActive: boolean }>>`
      UPDATE "AvailableCourse"
      SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "code" = ${code}
      RETURNING "code", "name", "isActive"
    `;

    return createSuccessResponse(updated);
  } catch (error) {
    console.error('Erro ao desativar curso:', error);
    return createErrorResponse('Erro ao desativar curso.', 500);
  }
}
