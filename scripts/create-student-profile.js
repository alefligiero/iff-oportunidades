const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createStudentProfile() {
  try {
    // Buscar o usuário de teste
    const user = await prisma.user.findUnique({
      where: { email: 'teste@iff.edu.br' }
    });

    if (!user) {
      console.log('❌ Usuário de teste não encontrado. Execute primeiro o script create-test-user.js');
      return;
    }

    // Verificar se já existe perfil de estudante
    const existingProfile = await prisma.student.findUnique({
      where: { userId: user.id }
    });

    if (existingProfile) {
      console.log('✅ Perfil de estudante já existe!');
      console.log('Nome:', existingProfile.name);
      console.log('Matrícula:', existingProfile.matricula);
      return;
    }

    // Criar perfil de estudante
    const studentProfile = await prisma.student.create({
      data: {
        name: 'João Silva Teste',
        matricula: '2024001',
        userId: user.id
      }
    });

    console.log('✅ Perfil de estudante criado com sucesso!');
    console.log('Nome:', studentProfile.name);
    console.log('Matrícula:', studentProfile.matricula);
    console.log('User ID:', studentProfile.userId);

  } catch (error) {
    console.error('❌ Erro ao criar perfil de estudante:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createStudentProfile();

