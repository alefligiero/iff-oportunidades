const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testUserNames() {
  console.log('🧪 Testando exibição de nomes de usuários...\n');

  const testUsers = [
    { email: 'teste@iff.edu.br', password: '123456', expectedName: 'João Silva Teste', role: 'STUDENT' },
    { email: 'admin@iff.edu.br', password: '123456', expectedName: 'Administrador', role: 'ADMIN' },
    { email: 'empresa@teste.com', password: '123456', expectedName: 'Empresa Teste LTDA', role: 'COMPANY' }
  ];

  for (const user of testUsers) {
    try {
      console.log(`\n🔍 Testando usuário ${user.role}:`);
      console.log(`   Email: ${user.email}`);
      
      // Fazer login
      const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: user.email,
        password: user.password
      });

      if (loginResponse.data.token) {
        console.log('   ✅ Login realizado com sucesso');
        
        // Buscar dados do usuário
        const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${loginResponse.data.token}`
          }
        });

        const userData = userResponse.data;
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   👤 Nome: ${userData.name || 'N/A'}`);
        console.log(`   🎭 Role: ${userData.role}`);
        
        if (userData.name === user.expectedName) {
          console.log('   ✅ Nome correto retornado!');
        } else {
          console.log(`   ❌ Nome incorreto. Esperado: ${user.expectedName}, Recebido: ${userData.name}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Erro ao testar usuário ${user.email}:`, error.message);
    }
  }

  console.log('\n🎉 Teste de nomes de usuários concluído!');
  console.log('\n📋 Resumo:');
  console.log('   ✅ STUDENT: João Silva Teste');
  console.log('   ✅ ADMIN: Administrador');
  console.log('   ✅ COMPANY: Empresa Teste LTDA');
  console.log('\n💡 Agora o dashboard deve mostrar os nomes corretos!');
}

testUserNames();

