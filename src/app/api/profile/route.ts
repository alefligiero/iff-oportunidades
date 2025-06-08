import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    return NextResponse.json({ 
      message: 'Acesso autorizado!', 
      data: { userProfile: 'Dados do perfil do usuário...' } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
