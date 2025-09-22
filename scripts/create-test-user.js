const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Verificar se já existe um usuário de teste
    const existingUser = await prisma.user.findUnique({
      where: { email: 'teste@iff.edu.br' }
    });

    if (existingUser) {
      console.log('✅ Usuário de teste já existe!');
      console.log('Email: teste@iff.edu.br');
      console.log('Senha: 123456');
      console.log('Role:', existingUser.role);
      return;
    }

    // Criar usuário de teste
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'teste@iff.edu.br',
        password: hashedPassword,
        role: 'STUDENT'
      }
    });

    // Criar perfil de estudante
    const studentProfile = await prisma.student.create({
      data: {
        name: 'João Silva Teste',
        matricula: '2024001',
        userId: user.id
      }
    });

    console.log('✅ Usuário de teste criado com sucesso!');
    console.log('Email: teste@iff.edu.br');
    console.log('Senha: 123456');
    console.log('Role: STUDENT');
    console.log('ID:', user.id);
    console.log('Perfil de Estudante:');
    console.log('  Nome:', studentProfile.name);
    console.log('  Matrícula:', studentProfile.matricula);

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
