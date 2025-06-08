import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return new NextResponse(
      JSON.stringify({ error: 'Autenticação necessária.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.');
    }

    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);

    return NextResponse.next();
  } catch (error) {
    console.error('Erro na verificação do JWT:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Token inválido ou expirado.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: '/api/((?!auth).*)',
};
