import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateRequest } from './utils';

// ===== MIDDLEWARE DE VALIDAÇÃO =====

/**
 * Middleware para validar autenticação
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId || !userRole) {
      return NextResponse.json(
        { error: 'Autenticação necessária' }, 
        { status: 401 }
      );
    }

    return handler(request, ...args);
  };
}

/**
 * Middleware para validar role específico
 */
export function withRole(allowedRoles: string[]) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const userRole = request.headers.get('x-user-role');

      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.json(
          { error: 'Acesso negado. Permissão insuficiente.' }, 
          { status: 403 }
        );
      }

      return handler(request, ...args);
    };
  };
}

/**
 * Middleware para validar corpo da requisição
 */
export function withBodyValidation<T>(schema: z.ZodSchema<T>) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const validation = await validateRequest(request, {
        bodySchema: schema,
        requiredHeaders: ['x-user-id', 'x-user-role']
      });

      if (!validation.success) {
        return validation.error;
      }

      return handler(request, validation.data, ...args);
    };
  };
}

/**
 * Middleware para validar parâmetros da URL
 */
export function withParamValidation<T>(schema: z.ZodSchema<T>) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const validation = await validateRequest(request, {
        paramSchema: schema,
        requiredHeaders: ['x-user-id', 'x-user-role']
      });

      if (!validation.success) {
        return validation.error;
      }

      return handler(request, validation.data, ...args);
    };
  };
}

/**
 * Middleware para validar query parameters
 */
export function withQueryValidation<T>(schema: z.ZodSchema<T>) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const validation = await validateRequest(request, {
        querySchema: schema,
        requiredHeaders: ['x-user-id', 'x-user-role']
      });

      if (!validation.success) {
        return validation.error;
      }

      return handler(request, validation.data, ...args);
    };
  };
}

/**
 * Middleware combinado para validação completa
 */
export function withValidation<TBody, TParams, TQuery>(options: {
  bodySchema?: z.ZodSchema<TBody>;
  paramSchema?: z.ZodSchema<TParams>;
  querySchema?: z.ZodSchema<TQuery>;
  allowedRoles?: string[];
}) {
  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const validation = await validateRequest(request, {
        bodySchema: options.bodySchema,
        paramSchema: options.paramSchema,
        querySchema: options.querySchema,
        requiredHeaders: ['x-user-id', 'x-user-role']
      });

      if (!validation.success) {
        return validation.error;
      }

      // Validar role se especificado
      if (options.allowedRoles) {
        const userRole = request.headers.get('x-user-role');
        if (!userRole || !options.allowedRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Acesso negado. Permissão insuficiente.' }, 
            { status: 403 }
          );
        }
      }

      return handler(request, validation.data, ...args);
    };
  };
}

/**
 * Middleware para tratamento de erros
 */
export function withErrorHandling(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      console.error('Erro na API:', error);
      
      if (error instanceof Error) {
        return NextResponse.json(
          { error: 'Erro interno do servidor', message: error.message }, 
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: 'Erro interno do servidor' }, 
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware para logging de requisições
 */
export function withLogging(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    const userRole = request.headers.get('x-user-role');

    console.log(`[${method}] ${url} - Role: ${userRole || 'N/A'}`);

    const response = await handler(request, ...args);
    
    const duration = Date.now() - start;
    console.log(`[${method}] ${url} - ${response.status} - ${duration}ms`);

    return response;
  };
}

/**
 * Middleware para rate limiting básico
 */
export function withRateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return function(handler: Function) {
    return async (request: NextRequest, ...args: any[]) => {
      const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;

      // Limpar requisições antigas
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < windowStart) {
          requests.delete(key);
        }
      }

      const userRequests = requests.get(ip) || { count: 0, resetTime: now + windowMs };
      
      if (userRequests.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Muitas requisições. Tente novamente mais tarde.' }, 
          { status: 429 }
        );
      }

      userRequests.count++;
      requests.set(ip, userRequests);

      return handler(request, ...args);
    };
  };
}

