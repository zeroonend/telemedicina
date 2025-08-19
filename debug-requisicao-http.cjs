const axios = require('axios');

// Simular exatamente a requisição HTTP do teste
async function testarRequisicaoHTTP() {
  console.log('🔍 TESTANDO REQUISIÇÃO HTTP REAL');
  console.log('================================');
  
  try {
    // Login do médico primeiro
    console.log('1. Fazendo login do médico...');
    const loginResponse = await axios.post('http://localhost:3002/api/auth/login', {
      email: 'medico@teste.com',
      password: '123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso');
    
    // Dados da prescrição exatamente como no teste
    const novaPrescricao = {
      consulta_id: '32610a5e-74bf-45db-97cc-6fdd780b5e44',
      medicamentos: [
        {
          nome: 'Paracetamol',
          dosagem: '500mg',
          frequencia: '8/8h',
          duracao: '7 dias',
          observacoes: 'Tomar após as refeições'
        },
        {
          nome: 'Ibuprofeno',
          dosagem: '400mg',
          frequencia: '12/12h',
          duracao: '5 dias',
          observacoes: 'Em caso de dor'
        }
      ],
      orientacoes: 'Manter repouso e hidratação adequada'
    };
    
    console.log('2. Dados da prescrição:');
    console.log(JSON.stringify(novaPrescricao, null, 2));
    
    console.log('3. Enviando requisição POST...');
    console.log('Content-Type: application/json');
    console.log('Body (stringified):', JSON.stringify(novaPrescricao));
    
    // Fazer a requisição exatamente como no teste
    const response = await axios.post(
      'http://localhost:3002/api/prescricoes',
      novaPrescricao, // axios automaticamente faz JSON.stringify
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Prescrição criada com sucesso!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Erro na requisição:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Erro:', error.message);
    }
  }
}

testarRequisicaoHTTP();