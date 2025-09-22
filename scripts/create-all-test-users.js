const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAllTestUsers() {
  console.log('🧪 Criando usuários de teste para todos os roles...\n');

  try {
    // 1. Usuário ADMIN
    console.log('1️⃣ Criando usuário ADMIN...');
    const adminUser = await createOrUpdateUser({
      email: 'admin@iff.edu.br',
      password: '123456',
      role: 'ADMIN'
    });

    // 2. Usuário STUDENT
    console.log('\n2️⃣ Criando usuário STUDENT...');
    const studentUser = await createOrUpdateUser({
      email: 'teste@iff.edu.br',
      password: '123456',
      role: 'STUDENT'
    });

    // Criar perfil de estudante
    await createOrUpdateStudentProfile(studentUser.id, {
      name: 'João Silva Teste',
      matricula: '2024001'
    });

    // 3. Usuário COMPANY
    console.log('\n3️⃣ Criando usuário COMPANY...');
    const companyUser = await createOrUpdateUser({
      email: 'empresa@teste.com',
      password: '123456',
      role: 'COMPANY'
    });

    // Criar perfil de empresa
    await createOrUpdateCompanyProfile(companyUser.id, {
      name: 'Empresa Teste LTDA',
      cnpj: '12.345.678/0001-90'
    });

    console.log('\n🎉 Todos os usuários de teste foram criados/atualizados!');
    console.log('\n📋 Credenciais de teste:');
    console.log('ADMIN:');
    console.log('  Email: admin@iff.edu.br');
    console.log('  Senha: 123456');
    console.log('\nSTUDENT:');
    console.log('  Email: teste@iff.edu.br');
    console.log('  Senha: 123456');
    console.log('  Nome: João Silva Teste');
    console.log('  Matrícula: 2024001');
    console.log('\nCOMPANY:');
    console.log('  Email: empresa@teste.com');
    console.log('  Senha: 123456');
    console.log('  Nome: Empresa Teste LTDA');
    console.log('  CNPJ: 12.345.678/0001-90');

  } catch (error) {
    console.error('❌ Erro ao criar usuários de teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createOrUpdateUser({ email, password, role }) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log(`   ✅ Usuário ${role} já existe: ${email}`);
    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      role
    }
  });

  console.log(`   ✅ Usuário ${role} criado: ${email}`);
  return user;
}

async function createOrUpdateStudentProfile(userId, { name, matricula }) {
  const existingProfile = await prisma.student.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    console.log(`   ✅ Perfil de estudante já existe: ${name}`);
    return existingProfile;
  }

  const profile = await prisma.student.create({
    data: {
      name,
      matricula,
      userId
    }
  });

  console.log(`   ✅ Perfil de estudante criado: ${name} (${matricula})`);
  return profile;
}

async function createOrUpdateCompanyProfile(userId, { name, cnpj }) {
  const existingProfile = await prisma.company.findUnique({
    where: { userId }
  });

  if (existingProfile) {
    console.log(`   ✅ Perfil de empresa já existe: ${name}`);
    return existingProfile;
  }

  const profile = await prisma.company.create({
    data: {
      name,
      cnpj,
      userId
    }
  });

  console.log(`   ✅ Perfil de empresa criado: ${name} (${cnpj})`);
  return profile;
}

createAllTestUsers();

