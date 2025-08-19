// Script para testar autenticação e token do authStore
import fetch from 'node-fetch';

// Simular dados de login
const testLogin = async () => {
  try {
    console.log('=== TESTANDO LOGIN ===');
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'medico@teste.com',
        password: '123456'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login bem-sucedido');
      console.log('Token:', data.token);
      console.log('Usuário:', data.user);
      
      // Testar API de prescrições com o token
      await testPrescricoes(data.token);
    } else {
      console.log('❌ Erro no login:', data.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
};

// Testar API de prescrições
const testPrescricoes = async (token) => {
  try {
    console.log('\n=== TESTANDO API PRESCRIÇÕES ===');
    
    const response = await fetch('http://localhost:3002/api/prescricoes', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API prescrições funcionando');
      console.log('Total de prescrições:', data.prescricoes?.length || 0);
    } else {
      console.log('❌ Erro na API prescrições:', response.status, response.statusText);
      const errorData = await response.json();
      console.log('Detalhes do erro:', errorData);
    }
  } catch (error) {
    console.error('❌ Erro na requisição prescrições:', error.message);
  }
};

// Executar teste
testLogin();