import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ error: 'Token de autenticação não fornecido.' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.');
    }

    const secret = new TextEncoder().encode(jwtSecret);
    let payload;
    
    try {
      const verified = await jwtVerify(token, secret);
      payload = verified.payload;
    } catch (jwtError: any) {
      // Token expirado ou inválido é uma situação normal, não um erro
      if (jwtError.code === 'ERR_JWT_EXPIRED') {
        return NextResponse.json({ error: 'Token expirado. Por favor, faça login novamente.' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    if (!payload.userId || !payload.role) {
      return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
    }

    // Buscar dados do usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: payload.userId as string },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Buscar nome do perfil específico
    let name: string | undefined;
    
    if (user.role === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({
        where: { userId: user.id },
        select: { name: true }
      });
      name = studentProfile?.name;
    } else if (user.role === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({
        where: { userId: user.id },
        select: { name: true }
      });
      name = companyProfile?.name;
    } else if (user.role === 'ADMIN') {
      name = 'Administrador';
    }

    return NextResponse.json({
      ...user,
      name
    });

  } catch (error) {
    console.error('Erro crítico ao buscar dados do usuário:', error);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
