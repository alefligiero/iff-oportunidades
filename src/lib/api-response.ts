/**
 * Utilitários para criação de respostas padronizadas nas APIs
 */

export function createSuccessResponse<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function createValidationErrorResponse(errors: Record<string, unknown>) {
  return Response.json(
    {
      error: 'Dados inválidos',
      details: errors,
    },
    { status: 400 }
  );
}
