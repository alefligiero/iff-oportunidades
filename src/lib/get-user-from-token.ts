import { NextRequest } from 'next/server';
import { jwtVerify, type JWTPayload } from 'jose';

interface UserPayload extends JWTPayload {
  userId: string;
  role: 'ADMIN' | 'STUDENT' | 'COMPANY';
}

/**
 * @param request
 * @returns
 */
export async function getUserFromToken(request: NextRequest): Promise<UserPayload> {
  // Prioriza cookie (auth_token); fallback para Authorization header
  const cookieToken = request.cookies.get('auth_token')?.value;
  const headerToken = request.headers.get('authorization')?.split(' ')[1];
  const token = cookieToken || headerToken;

  if (!token) {
    throw new Error('Token de autenticação não fornecido.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('A variável de ambiente JWT_SECRET não está definida.');
  }

  const secret = new TextEncoder().encode(jwtSecret);
  const { payload } = await jwtVerify(token, secret);

  if (!payload.userId || !payload.role) {
    throw new Error('Payload do token inválido.');
  }

  return payload as UserPayload;
}
