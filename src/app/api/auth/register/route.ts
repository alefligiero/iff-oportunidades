import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const prisma = new PrismaClient();

const userSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter no mínimo 6 caracteres' }),
  role: z.enum(['STUDENT', 'COMPANY']),
  name: z.string().min(3, { message: 'O nome é obrigatório' }),
  document: z.string().min(5, { message: 'Documento inválido' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = userSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, role, name, document } = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Este email já está em uso' }, { status: 409 });
    }

    if (role === 'STUDENT') {
      const existingStudent = await prisma.student.findUnique({ where: { matricula: document } });
      if (existingStudent) {
        return NextResponse.json({ error: 'Esta matrícula já está cadastrada' }, { status: 409 });
      }
    } else if (role === 'COMPANY') {
      const existingCompany = await prisma.company.findUnique({ where: { cnpj: document } });
      if (existingCompany) {
        return NextResponse.json({ error: 'Este CNPJ já está cadastrado' }, { status: 409 });
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
    
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(userWithoutPassword, { status: 201 });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
