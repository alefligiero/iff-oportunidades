import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse } from '@/lib/validations/utils';
import { withErrorHandling, withLogging, withAuth } from '@/lib/validations/middleware';

const prisma = new PrismaClient();

async function getVacancies(request: NextRequest) {
  const approvedVacancies = await prisma.jobVacancy.findMany({
    where: {
      status: 'APPROVED',
    },
    include: {
      company: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return createSuccessResponse(approvedVacancies);
}

export const GET = withErrorHandling(withLogging(withAuth(getVacancies)));
