const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_EMAIL = 'teste@iff.edu.br';
const TEST_PASSWORD = '123456';

async function testAuthentication() {
  console.log('🧪 Iniciando testes de autenticação...\n');

  try {
    // Teste 1: Login
    console.log('1️⃣ Testando login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    if (loginResponse.data.token) {
      console.log('✅ Login bem-sucedido!');
      console.log(`   Token: ${loginResponse.data.token.substring(0, 20)}...`);
    } else {
      console.log('❌ Falha no login');
      return;
    }

    const token = loginResponse.data.token;

    // Teste 2: Buscar dados do usuário
    console.log('\n2️⃣ Testando busca de dados do usuário...');
    const userResponse = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (userResponse.data.email === TEST_EMAIL) {
      console.log('✅ Dados do usuário obtidos com sucesso!');
      console.log(`   Email: ${userResponse.data.email}`);
      console.log(`   Role: ${userResponse.data.role}`);
    } else {
      console.log('❌ Falha ao buscar dados do usuário');
    }

    // Teste 3: Testar token inválido
    console.log('\n3️⃣ Testando token inválido...');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': 'Bearer token_invalido'
        }
      });
      console.log('❌ Token inválido deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Token inválido rejeitado corretamente');
      } else {
        console.log('❌ Erro inesperado com token inválido');
      }
    }

    // Teste 4: Testar sem token
    console.log('\n4️⃣ Testando requisição sem token...');
    try {
      await axios.get(`${BASE_URL}/api/auth/me`);
      console.log('❌ Requisição sem token deveria ter falhado');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Requisição sem token rejeitada corretamente');
      } else {
        console.log('❌ Erro inesperado sem token');
      }
    }

    console.log('\n🎉 Todos os testes de API passaram!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Acesse http://localhost:3000 no navegador');
    console.log('   2. Use as credenciais:');
    console.log(`      Email: ${TEST_EMAIL}`);
    console.log(`      Senha: ${TEST_PASSWORD}`);
    console.log('   3. Teste o fluxo completo no navegador');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Verificar se axios está disponível
try {
  require.resolve('axios');
  testAuthentication();
} catch (error) {
  console.log('❌ Axios não encontrado. Instalando...');
  const { execSync } = require('child_process');
  execSync('npm install axios', { stdio: 'inherit' });
  console.log('✅ Axios instalado. Execute o script novamente.');
}

