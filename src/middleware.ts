import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ error: 'Autenticação necessária.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return NextResponse.redirect(new URL('/', request.url));
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
    
    const loginUrl = new URL('/', request.url);
    
    const response = NextResponse.redirect(loginUrl);
    
    response.cookies.delete('auth_token');
    
    return response;
  }
}

export const config = {
  matcher: ['/api/((?!auth).*)', '/dashboard/:path*'],
};
