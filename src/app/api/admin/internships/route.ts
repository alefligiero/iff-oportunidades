import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse, createErrorResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging, withRole } from '@/lib/validations/middleware';

const prisma = new PrismaClient();

async function getPendingInternships(request: NextRequest) {
  const pendingInternships = await prisma.internship.findMany({
    where: {
      status: 'IN_ANALYSIS',
    },
    include: {
      student: {
        select: {
          name: true,
          matricula: true,
        },
      },
      company: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return createSuccessResponse(pendingInternships);
}

export const GET = withErrorHandling(withLogging(withRole(['ADMIN'])(getPendingInternships)));
