import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createContactMessageSchema } from '@/lib/validations/schemas';
import { NotificationType, Role } from '@prisma/client';
import { ContactMessageStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role === 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const messages = await prisma.contactMessage.findMany({
      where: { userId: userPayload.userId },
      orderBy: { createdAt: 'desc' },
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
      })),
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar mensagens:', error);
    return createErrorResponse('Erro ao buscar mensagens', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role === 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const openMessagesCount = await prisma.contactMessage.count({
      where: {
        userId: userPayload.userId,
        status: ContactMessageStatus.OPEN,
      },
    });

    if (openMessagesCount >= 3) {
      return createErrorResponse('Voce ja possui 3 mensagens em aberto. Aguarde a resposta.', 400);
    }

    const body = await request.json();
    const validation = createContactMessageSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const { subject, message } = validation.data;

    const createdMessage = await prisma.contactMessage.create({
      data: {
        userId: userPayload.userId,
        subject: subject.trim(),
        message: message.trim(),
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.CONTACT_MESSAGE,
          title: 'Nova mensagem de contato',
          message: `Nova mensagem recebida: ${createdMessage.subject}.`,
          href: '/dashboard/admin/contact',
        })),
      });
    }

    return createSuccessResponse({
      message: 'Mensagem enviada com sucesso',
      data: {
        id: createdMessage.id,
        subject: createdMessage.subject,
        message: createdMessage.message,
        status: createdMessage.status,
        adminReply: createdMessage.adminReply,
        repliedAt: createdMessage.repliedAt,
        createdAt: createdMessage.createdAt,
        updatedAt: createdMessage.updatedAt,
      },
    }, 201);
  } catch (error: unknown) {
    console.error('Erro ao enviar mensagem:', error);
    return createErrorResponse('Erro ao enviar mensagem', 500);
  }
}
