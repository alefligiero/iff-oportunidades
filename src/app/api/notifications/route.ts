import { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '@/lib/api-response';

const updateNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  markAll: z.boolean().optional(),
});

const deleteNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
});

const toNotificationDto = (notification: {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string | null;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  href: notification.href,
  readAt: notification.readAt ? notification.readAt.toISOString() : null,
  createdAt: notification.createdAt.toISOString(),
  updatedAt: notification.updatedAt.toISOString(),
});

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.max(Number(limitParam), 1) : 20;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: userPayload.userId },
        orderBy: { createdAt: 'desc' },
        take: Number.isNaN(limit) ? 20 : limit,
      }),
      prisma.notification.count({
        where: { userId: userPayload.userId, readAt: null },
      }),
    ]);

    return createSuccessResponse({
      notifications: notifications.map(toNotificationDto),
      unreadCount,
    });
  } catch (error: unknown) {
    console.error('Erro ao buscar notificacoes:', error);
    return createErrorResponse('Erro ao buscar notificacoes', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    const body = await request.json().catch(() => null);
    const validation = updateNotificationsSchema.safeParse(body || {});

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const { ids, markAll } = validation.data;

    if (!markAll && (!ids || ids.length === 0)) {
      return createErrorResponse('Informe quais notificacoes devem ser marcadas', 400);
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId: userPayload.userId,
        ...(markAll ? {} : { id: { in: ids } }),
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return createSuccessResponse({ updatedCount: result.count });
  } catch (error: unknown) {
    console.error('Erro ao atualizar notificacoes:', error);
    return createErrorResponse('Erro ao atualizar notificacoes', 500);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);

    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    const body = await request.json().catch(() => null);
    const validation = deleteNotificationsSchema.safeParse(body || {});

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const { ids } = validation.data;

    const result = await prisma.notification.deleteMany({
      where: {
        userId: userPayload.userId,
        ...(ids && ids.length > 0 ? { id: { in: ids } } : {}),
      },
    });

    return createSuccessResponse({ deletedCount: result.count });
  } catch (error: unknown) {
    console.error('Erro ao remover notificacoes:', error);
    return createErrorResponse('Erro ao remover notificacoes', 500);
  }
}
