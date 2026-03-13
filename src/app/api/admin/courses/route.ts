import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { listCourses, normalizeCourseCode } from '@/lib/courses';
import { prisma } from '@/lib/prisma';

const createCourseSchema = z.object({
  name: z.string().min(3, 'Nome do curso deve ter pelo menos 3 caracteres.').max(120, 'Nome do curso muito longo.'),
});

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const includeInactive = request.nextUrl.searchParams.get('includeInactive') === 'true';
    const courses = await listCourses(includeInactive);
    return createSuccessResponse(courses);
  } catch (error) {
    console.error('Erro ao listar cursos:', error);
    return createErrorResponse('Erro ao listar cursos.', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload || userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await request.json();
    const validation = createCourseSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const name = validation.data.name.trim();
    const baseCode = normalizeCourseCode(name);

    if (!baseCode) {
      return createErrorResponse('Nao foi possivel gerar um codigo para o curso.', 400);
    }

    let code = baseCode;
    let index = 1;

    const exists = async (candidate: string) => {
      const rows = await prisma.$queryRaw<Array<{ code: string }>>`
        SELECT "code" FROM "AvailableCourse" WHERE "code" = ${candidate} LIMIT 1
      `;
      return rows.length > 0;
    };

    while (await exists(code)) {
      code = `${baseCode}_${index}`;
      index += 1;
    }

    const [created] = await prisma.$queryRaw<Array<{ code: string; name: string; isActive: boolean }>>`
      INSERT INTO "AvailableCourse" ("code", "name", "isActive", "createdAt", "updatedAt")
      VALUES (${code}, ${name}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING "code", "name", "isActive"
    `;

    return createSuccessResponse(created, 201);
  } catch (error) {
    console.error('Erro ao criar curso:', error);
    if (error instanceof Error && error.message.includes('AvailableCourse_name_key')) {
      return createErrorResponse('Ja existe um curso com esse nome.', 409);
    }
    return createErrorResponse('Erro ao criar curso.', 500);
  }
}
