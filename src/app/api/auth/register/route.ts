import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { registerSchema } from '@/lib/validations/schemas';
import { validateRequestBody, createErrorResponse, createSuccessResponse } from '@/lib/validations/utils';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRequestBody(registerSchema, body);

    if (!validation.success) {
      return validation.error;
    }

    const { email, password, role, name, document } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return createErrorResponse('Este email já está em uso', 409);
    }

    if (role === 'STUDENT') {
      const existingStudent = await prisma.student.findUnique({ where: { matricula: document } });
      if (existingStudent) {
        return createErrorResponse('Esta matrícula já está cadastrada', 409);
      }
    } else if (role === 'COMPANY') {
      const existingCompany = await prisma.company.findUnique({ where: { cnpj: document } });
      if (existingCompany) {
        return createErrorResponse('Este CNPJ já está cadastrado', 409);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
        },
      });

      if (role === 'STUDENT') {
        await tx.student.create({
          data: {
            name,
            matricula: document,
            userId: newUser.id,
          },
        });
      } else if (role === 'COMPANY') {
        await tx.company.create({
          data: {
            name,
            cnpj: document,
            userId: newUser.id,
          },
        });
      }

      return newUser;
    });
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return createSuccessResponse(userWithoutPassword, 201);

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return createErrorResponse('Ocorreu um erro interno no servidor.', 500);
  }
}
