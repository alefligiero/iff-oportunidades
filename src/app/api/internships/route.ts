import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { createInternshipSchema } from '@/lib/validations/schemas';
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging, withValidation } from '@/lib/validations/middleware';

const prisma = new PrismaClient();

async function createInternship(request: NextRequest, data: any) {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role') as Role;

  if (!userId || userRole !== 'STUDENT') {
    return createErrorResponse('Acesso negado.', 403);
  }

  const studentProfile = await prisma.student.findUnique({
    where: { userId: userId },
  });
  if (!studentProfile) {
    return createErrorResponse('Perfil de aluno não encontrado.', 404);
  }

  const validation = validateRequestBody(createInternshipSchema, data.body);

  if (!validation.success) {
    return validation.error;
  }

  const internshipData = validation.data;

  const newInternship = await prisma.$transaction(async (tx) => {
    const internship = await tx.internship.create({
      data: {
        ...internshipData,
        studentId: studentProfile.id,
      },
    });

    await tx.document.createMany({
      data: [
        { type: 'TCE', internshipId: internship.id },
        { type: 'PAE', internshipId: internship.id },
      ],
    });

    return internship;
  });

  return createSuccessResponse(newInternship, 201);
}

export const POST = withErrorHandling(withLogging(withValidation({
  bodySchema: createInternshipSchema,
  allowedRoles: ['STUDENT']
})(createInternship)));
