import { NextResponse, type NextRequest } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes. Acesso negado pelo middleware.' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    let name: string | null = null;
    let additionalData: Record<string, string> = {};

    if (userRole === 'STUDENT') {
      const studentProfile = await prisma.student.findUnique({
        where: { userId },
        select: { name: true, matricula: true },
      });
      name = studentProfile?.name ?? null;
      additionalData.matricula = studentProfile?.matricula ?? '';
    } else if (userRole === 'COMPANY') {
      const companyProfile = await prisma.company.findUnique({
        where: { userId },
        select: { name: true, cnpj: true },
      });
      name = companyProfile?.name ?? null;
      additionalData.cnpj = companyProfile?.cnpj ?? '';
    } else if (userRole === 'ADMIN') {
        name = 'Administrador';
    }

    return NextResponse.json({ ...user, name, ...additionalData });

  } catch (error: unknown) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role') as Role;

    if (!userId || !userRole) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes.' }, { status: 401 });
    }

    const body = await request.json();
    const { email, name, matricula, cnpj } = body;

    // Validar email
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: 'Por favor, insira um formato de email válido.' }, { status: 400 });
    }

    // Validar matrícula (12 dígitos) para estudantes
    if (userRole === 'STUDENT' && matricula) {
      const unmaskedMatricula = matricula.replace(/[^\d]/g, '');
      if (unmaskedMatricula.length !== 12) {
        return NextResponse.json({ error: 'A matrícula deve conter exatamente 12 números.' }, { status: 400 });
      }
    }

    // Validar CNPJ (14 dígitos) para empresas
    if (userRole === 'COMPANY' && cnpj) {
      const unmaskedCnpj = cnpj.replace(/[^\d]/g, '');
      if (unmaskedCnpj.length !== 14) {
        return NextResponse.json({ error: 'O CNPJ deve conter 14 números.' }, { status: 400 });
      }
    }

    // Verificar se email já existe (se tentando mudar)
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'E-mail já está em uso.' }, { status: 400 });
      }
    }

    // Atualizar User (email)
    if (email) {
      await prisma.user.update({
        where: { id: userId },
        data: { email },
      });
    }

    // Atualizar Student ou Company
    if (userRole === 'STUDENT') {
      const updateData: { name?: string; matricula?: string } = {};
      if (name) updateData.name = name;
      if (matricula) {
        const unmaskedMatricula = matricula.replace(/[^\d]/g, '');
        // Verificar se matrícula já existe
        const existingStudent = await prisma.student.findFirst({
          where: { matricula: unmaskedMatricula, userId: { not: userId } },
        });
        if (existingStudent) {
          return NextResponse.json({ error: 'Matrícula já está em uso.' }, { status: 400 });
        }
        updateData.matricula = unmaskedMatricula;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.student.update({
          where: { userId },
          data: updateData,
        });
      }
    } else if (userRole === 'COMPANY') {
      const updateData: { name?: string; cnpj?: string } = {};
      if (name) updateData.name = name;
      if (cnpj) {
        const unmaskedCnpj = cnpj.replace(/[^\d]/g, '');
        // Verificar se CNPJ já existe
        const existingCompany = await prisma.company.findFirst({
          where: { cnpj: unmaskedCnpj, userId: { not: userId } },
        });
        if (existingCompany) {
          return NextResponse.json({ error: 'CNPJ já está em uso.' }, { status: 400 });
        }
        updateData.cnpj = unmaskedCnpj;
      }
      if (Object.keys(updateData).length > 0) {
        await prisma.company.update({
          where: { userId },
          data: updateData,
        });
      }
    }

    return NextResponse.json({ message: 'Dados atualizados com sucesso.' });

  } catch (error: unknown) {
    console.error('Erro ao atualizar dados do usuário:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
