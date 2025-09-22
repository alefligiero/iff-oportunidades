import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// ===== UTILITÁRIOS DE VALIDAÇÃO =====

/**
 * Valida o corpo da requisição com um schema Zod
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: unknown) {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        { 
          error: 'Dados inválidos', 
          details: result.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      )
    };
  }

  return {
    success: true,
    data: result.data
  };
}

/**
 * Valida parâmetros da URL com um schema Zod
 */
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown) {
  const result = schema.safeParse(params);
  
  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        { 
          error: 'Parâmetros inválidos', 
          details: result.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      )
    };
  }

  return {
    success: true,
    data: result.data
    };
}

/**
 * Valida query parameters com um schema Zod
 */
export function validateQuery<T>(schema: z.ZodSchema<T>, searchParams: URLSearchParams) {
  const queryObject = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(queryObject);
  
  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        { 
          error: 'Parâmetros de consulta inválidos', 
          details: result.error.flatten().fieldErrors 
        }, 
        { status: 400 }
      )
    };
  }

  return {
    success: true,
    data: result.data
  };
}

/**
 * Valida headers da requisição
 */
export function validateHeaders(request: NextRequest, requiredHeaders: string[]) {
  const missingHeaders = requiredHeaders.filter(header => !request.headers.get(header));
  
  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: NextResponse.json(
        { 
          error: 'Headers obrigatórios ausentes', 
          missing: missingHeaders 
        }, 
        { status: 400 }
      )
    };
  }

  return {
    success: true,
    data: Object.fromEntries(
      requiredHeaders.map(header => [header, request.headers.get(header)])
    )
  };
}

/**
 * Wrapper para validação de requisição completa
 */
export async function validateRequest<T>(request: NextRequest, options: {
  bodySchema?: z.ZodSchema<T>;
  paramSchema?: z.ZodSchema<any>;
  querySchema?: z.ZodSchema<any>;
  requiredHeaders?: string[];
}) {
  const { bodySchema, paramSchema, querySchema, requiredHeaders } = options;
  const result: any = {};

  // Validar headers se especificados
  if (requiredHeaders) {
    const headerValidation = validateHeaders(request, requiredHeaders);
    if (!headerValidation.success) {
      return { success: false, error: headerValidation.error };
    }
    result.headers = headerValidation.data;
  }

  // Validar parâmetros da URL se especificados
  if (paramSchema) {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const params = { id: pathSegments[pathSegments.length - 1] }; // Assumindo que o último segmento é o ID
    
    const paramValidation = validateParams(paramSchema, params);
    if (!paramValidation.success) {
      return { success: false, error: paramValidation.error };
    }
    result.params = paramValidation.data;
  }

  // Validar query parameters se especificados
  if (querySchema) {
    const url = new URL(request.url);
    const queryValidation = validateQuery(querySchema, url.searchParams);
    if (!queryValidation.success) {
      return { success: false, error: queryValidation.error };
    }
    result.query = queryValidation.data;
  }

  // Validar corpo da requisição se especificado
  if (bodySchema) {
    const body = await request.json();
    const bodyValidation = validateRequestBody(bodySchema, body);
    if (!bodyValidation.success) {
      return { success: false, error: bodyValidation.error };
    }
    result.body = bodyValidation.data;
  }

  return {
    success: true,
    data: result
  };
}

/**
 * Cria uma resposta de erro padronizada
 */
export function createErrorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    { 
      error: message,
      ...(details && { details })
    }, 
    { status }
  );
}

/**
 * Cria uma resposta de sucesso padronizada
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * Valida se um usuário tem permissão para acessar um recurso
 */
export function validateUserPermission(userRole: string, allowedRoles: string[]) {
  if (!allowedRoles.includes(userRole)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Acesso negado. Permissão insuficiente.' }, 
        { status: 403 }
      )
    };
  }

  return { success: true };
}

/**
 * Valida se um ID é um CUID válido
 */
export function validateCuid(id: string) {
  const cuidRegex = /^c[0-9a-z]{24}$/;
  if (!cuidRegex.test(id)) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'ID inválido' }, 
        { status: 400 }
      )
    };
  }

  return { success: true };
}

/**
 * Sanitiza dados de entrada removendo caracteres perigosos
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Valida formato de data
 */
export function validateDate(dateString: string) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Data inválida' }, 
        { status: 400 }
      )
    };
  }

  return { success: true, data: date };
}

