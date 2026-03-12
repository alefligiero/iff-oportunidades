import { NextRequest } from 'next/server';
import { getUserFromToken } from '@/lib/get-user-from-token';
import { createErrorResponse, createSuccessResponse, createValidationErrorResponse } from '@/lib/api-response';
import { updateSystemConfigSchema } from '@/lib/validations/schemas';
import { getSystemConfig, updateSystemConfig } from '@/lib/system-config';

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const config = await getSystemConfig();

    return createSuccessResponse({
      requireLifeInsuranceForNewInternships: config.requireLifeInsuranceForNewInternships,
      updatedAt: config.updatedAt,
    });
  } catch (error) {
    console.error('Erro ao buscar configuracoes do sistema:', error);
    return createErrorResponse('Erro ao buscar configuracoes do sistema', 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userPayload = await getUserFromToken(request);
    if (!userPayload) {
      return createErrorResponse('Nao autenticado', 401);
    }

    if (userPayload.role !== 'ADMIN') {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await request.json();
    const validation = updateSystemConfigSchema.safeParse(body);

    if (!validation.success) {
      return createValidationErrorResponse(validation.error.flatten().fieldErrors);
    }

    const updated = await updateSystemConfig(
      validation.data.requireLifeInsuranceForNewInternships
    );

    return createSuccessResponse({
      message: 'Configuracao atualizada com sucesso',
      requireLifeInsuranceForNewInternships: updated.requireLifeInsuranceForNewInternships,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Erro ao atualizar configuracoes do sistema:', error);
    return createErrorResponse('Erro ao atualizar configuracoes do sistema', 500);
  }
}
