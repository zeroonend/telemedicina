const fetch = require('node-fetch');
const BASE_URL = 'http://localhost:3002';

async function debugConsultas() {
  try {
    // Primeiro, fazer login para obter token
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'medico@teste.com', password: '123456' })
    });

    const loginData = await loginResponse.json();
    console.log('Resposta do login:', loginData);

    if (!loginData.token) {
      console.error('Erro: Token não encontrado na resposta');
      return;
    }

    const token = loginData.token;
    console.log('Token obtido:', token);

    // Agora, buscar consultas
    const consultasResponse = await fetch(`${BASE_URL}/api/consultas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const consultasData = await consultasResponse.json();
    console.log('Resposta da API /api/consultas:', consultasData);

    if (Array.isArray(consultasData.consultas)) {
      console.log('Consultas encontradas:', consultasData.consultas.length);
      consultasData.consultas.forEach((consulta, index) => {
        console.log(`Consulta ${index + 1}:`, consulta);
        console.log('paciente_id presente?', !!consulta.paciente_id);
      });
    } else {
      console.log('Formato inesperado para consultas');
    }

  } catch (error) {
    console.error('Erro durante o debug:', error);
  }
}

debugConsultas();