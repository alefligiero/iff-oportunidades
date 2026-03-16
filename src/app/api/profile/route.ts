import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ 
      message: 'Acesso autorizado!', 
      data: { userProfile: 'Dados do perfil do usuário...' } 
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
