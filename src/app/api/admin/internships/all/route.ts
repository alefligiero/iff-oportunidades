import { NextResponse, type NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { prisma } from '@/lib/prisma';
import { getCourseNameMap } from '@/lib/courses';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (userPayload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem visualizar os estágios.' }, { status: 403 });
    }

    const [internships, courseNameMap] = await Promise.all([
      prisma.internship.findMany({
        include: {
          student: {
            select: {
              name: true,
              matricula: true,
            },
          },
          documents: {
            select: {
              type: true,
              status: true,
              fileUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      getCourseNameMap(true),
    ]);

    const normalized = internships.map((internship) => ({
      ...internship,
      studentCourseName: courseNameMap[internship.studentCourse] || internship.studentCourse,
    }));

    return NextResponse.json(normalized);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('Token')) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    console.error('Erro ao listar estágios:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
