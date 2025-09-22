import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@/lib/validations/schemas';
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/validations/utils';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(loginSchema, body);

    if (!validation.success) {
      return validation.error;
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return createErrorResponse('Credenciais inválidas', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return createErrorResponse('Credenciais inválidas', 401);
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
    
    return createSuccessResponse({ token });

  } catch (error) {
    console.error('Erro no login:', error);
    return createErrorResponse('Ocorreu um erro interno no servidor.', 500);
  }
}
