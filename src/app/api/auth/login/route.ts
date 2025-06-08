import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'A senha é obrigatória' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('A variável de ambiente JWT_SECRET não está definida.');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      jwtSecret,
      { expiresIn: '7d' }
    );
    
    return NextResponse.json({ token });

  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
