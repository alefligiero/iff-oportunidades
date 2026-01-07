import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { changePasswordSchema } from '@/lib/validations/schemas';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'Cabeçalhos de autenticação ausentes.' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validação com Zod
    const validation = changePasswordSchema.safeParse(body);
    
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return NextResponse.json({ 
        error: firstError || 'Dados inválidos.',
        details: errors 
      }, { status: 400 });
    }

    const { currentPassword, newPassword } = validation.data;

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: 'Senha atualizada com sucesso.' });

  } catch (error: unknown) {
    console.error('Erro ao atualizar senha:', error);
    return NextResponse.json({ error: 'Ocorreu um erro interno no servidor.' }, { status: 500 });
  }
}
