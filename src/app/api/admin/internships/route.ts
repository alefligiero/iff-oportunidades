import { NextResponse, type NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging, withRole } from '@/lib/validations/middleware';
import { prisma } from '@/lib/prisma';

async function getPendingInternships(request: NextRequest) {
  const pendingInternships = await prisma.internship.findMany({
    where: {
      status: 'IN_ANALYSIS',
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      student: {
        select: {
          name: true,
          matricula: true,
        },
      },
      companyName: true,
      companyCnpj: true,
      companyEmail: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return createSuccessResponse(pendingInternships);
}

export const GET = withErrorHandling(withLogging(withRole(['ADMIN'])(getPendingInternships)));
