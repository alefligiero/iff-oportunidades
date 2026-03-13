import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response';
import { listCourses } from '@/lib/courses';

export async function GET(_request: NextRequest) {
  try {
    const courses = await listCourses(false);
    return createSuccessResponse(courses);
  } catch (error) {
    console.error('Erro ao listar cursos ativos:', error);
    return createErrorResponse('Erro ao listar cursos.', 500);
  }
}
