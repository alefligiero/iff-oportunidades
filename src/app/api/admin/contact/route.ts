import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const messages = await prisma.contactMessage.findMany({
      orderBy: [
        { status: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        user: {
          select: {
            email: true,
            role: true,
            studentProfile: { select: { name: true } },
            companyProfile: { select: { name: true } },
          },
        },
      },
    });

    return createSuccessResponse({
      messages: messages.map((message) => ({
        id: message.id,
        subject: message.subject,
        message: message.message,
        status: message.status,
        adminReply: message.adminReply,
        repliedAt: message.repliedAt ? message.repliedAt.toISOString() : null,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        user: {
          name:
            message.user.studentProfile?.name ||
            message.user.companyProfile?.name ||
            message.user.email,
          email: message.user.email,
          role: message.user.role,
        },
      })),
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar mensagens do admin:', error);
    return createErrorResponse('Erro ao buscar mensagens', 500);
  }
}
