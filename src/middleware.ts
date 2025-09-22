import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  // Para rotas da API (exceto auth), verificar token
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/')) {
    if (!token) {
      return new NextResponse(JSON.stringify({ error: 'Autenticação necessária.' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error('JWT_SECRET não está definida.');

      const secret = new TextEncoder().encode(jwtSecret);
      const { payload } = await jwtVerify(token, secret);

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

    } catch (error) {
      console.error('Erro na verificação do JWT:', error);
      return new NextResponse(JSON.stringify({ error: 'Token inválido ou expirado.' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  }

  // Para rotas do dashboard, o AuthGuard no layout irá gerenciar a autenticação
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/((?!auth).*)', '/dashboard/:path*'],
};
