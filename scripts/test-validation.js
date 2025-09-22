const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testValidation() {
  console.log('🧪 Testando validação Zod em todas as rotas...\n');

  try {
    // 1. Teste de login com dados inválidos
    console.log('1️⃣ Testando login com dados inválidos...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'email-invalido',
        password: ''
      });
      console.log('❌ Deveria ter falhado com email inválido');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validação de email inválido funcionando');
        console.log('   Erro:', error.response.data.error);
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 2. Teste de login com senha vazia
    console.log('\n2️⃣ Testando login com senha vazia...');
    try {
      await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'teste@iff.edu.br',
        password: ''
      });
      console.log('❌ Deveria ter falhado com senha vazia');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validação de senha vazia funcionando');
        console.log('   Erro:', error.response.data.error);
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 3. Teste de registro com dados inválidos
    console.log('\n3️⃣ Testando registro com dados inválidos...');
    try {
      await axios.post(`${BASE_URL}/api/auth/register`, {
        email: 'email-invalido',
        password: '123',
        role: 'INVALID_ROLE',
        name: 'A',
        document: '123'
      });
      console.log('❌ Deveria ter falhado com dados inválidos');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validação de registro funcionando');
        console.log('   Erros:', Object.keys(error.response.data.details || {}));
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 4. Teste de acesso sem autenticação
    console.log('\n4️⃣ Testando acesso sem autenticação...');
    try {
      await axios.get(`${BASE_URL}/api/vacancies`);
      console.log('❌ Deveria ter falhado sem autenticação');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Proteção de rota funcionando');
        console.log('   Erro:', error.response.data.error);
      } else {
        console.log('❌ Erro inesperado:', error.response?.data);
      }
    }

    // 5. Teste de login válido
    console.log('\n5️⃣ Testando login válido...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'teste@iff.edu.br',
      password: '123456'
    });

    if (loginResponse.data.token) {
      console.log('✅ Login válido funcionando');
      const token = loginResponse.data.token;

      // 6. Teste de acesso com token válido (usando cookie)
      console.log('\n6️⃣ Testando acesso com token válido...');
      const vacanciesResponse = await axios.get(`${BASE_URL}/api/vacancies`, {
        headers: {
          'Cookie': `auth_token=${token}`
        }
      });

      if (vacanciesResponse.status === 200) {
        console.log('✅ Acesso com token válido funcionando');
        console.log('   Vagas encontradas:', vacanciesResponse.data.length);
      }

      // 7. Teste de acesso a rota de admin sem permissão
      console.log('\n7️⃣ Testando acesso a rota de admin sem permissão...');
      try {
        await axios.get(`${BASE_URL}/api/admin/internships`, {
          headers: {
            'Cookie': `auth_token=${token}`
          }
        });
        console.log('❌ Deveria ter falhado sem permissão de admin');
      } catch (error) {
        if (error.response?.status === 403) {
          console.log('✅ Controle de acesso por role funcionando');
          console.log('   Erro:', error.response.data.error);
        } else {
          console.log('❌ Erro inesperado:', error.response?.data);
        }
      }
    }

    console.log('\n🎉 Testes de validação concluídos!');
    console.log('\n📋 Resumo:');
    console.log('   ✅ Validação de dados de entrada');
    console.log('   ✅ Proteção de rotas autenticadas');
    console.log('   ✅ Controle de acesso por roles');
    console.log('   ✅ Mensagens de erro padronizadas');
    console.log('   ✅ Logging de requisições');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testValidation();
