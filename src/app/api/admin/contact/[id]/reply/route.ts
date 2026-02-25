import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { replyContactMessageSchema } from '@/lib/validations/schemas';
import { ContactMessageStatus, NotificationType } from '@prisma/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const { id } = await params;
    const body = await request.json();
    const validation = replyContactMessageSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const { reply } = validation.data;

    const existingMessage = await prisma.contactMessage.findUnique({
      where: { id },
      select: {
        id: true,
        subject: true,
        userId: true,
      },
    });

    if (!existingMessage) {
      return createErrorResponse('Mensagem nao encontrada', 404);
    }

    const updatedMessage = await prisma.contactMessage.update({
      where: { id },
      data: {
        adminReply: reply.trim(),
        repliedAt: new Date(),
        repliedById: userPayload.userId,
        status: ContactMessageStatus.REPLIED,
      },
    });

    await prisma.notification.create({
      data: {
        userId: existingMessage.userId,
        type: NotificationType.CONTACT_MESSAGE,
        title: 'Resposta da agencia',
        message: `Sua mensagem "${existingMessage.subject}" foi respondida.`,
        href: '/dashboard/contact',
      },
    });

    return createSuccessResponse({
      message: 'Resposta enviada com sucesso',
      data: {
        id: updatedMessage.id,
        subject: updatedMessage.subject,
        message: updatedMessage.message,
        status: updatedMessage.status,
        adminReply: updatedMessage.adminReply,
        repliedAt: updatedMessage.repliedAt,
        createdAt: updatedMessage.createdAt,
        updatedAt: updatedMessage.updatedAt,
      },
    });
  } catch (error: unknown) {
    console.error('Erro ao responder mensagem:', error);
    return createErrorResponse('Erro ao responder mensagem', 500);
  }
}
