const fetch = require('node-fetch');

// Configuração da API
const API_BASE = 'http://localhost:3002';

// Função para fazer login e obter token
async function fazerLogin() {
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@telemedicina.com',
        password: 'admin123'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login realizado com sucesso');
      console.log('Token:', data.token);
      return data.token;
    } else {
      console.log('❌ Erro no login:', data.message || data.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição de login:', error.message);
    return null;
  }
}

/**
 * Função para testar APIs com token
 */
async function testarAPIsComToken(token) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  console.log('\n🧪 Testando APIs com token...');
  console.log('=' .repeat(50));
  
  // Testar prescrições
  try {
    console.log('\n📋 Testando /api/prescricoes');
    const prescricoesResponse = await fetch(`${API_BASE}/api/prescricoes`, { headers });
    const prescricoesData = await prescricoesResponse.json();
    console.log('Status:', prescricoesResponse.status);
    console.log('Dados:', JSON.stringify(prescricoesData, null, 2));
  } catch (error) {
    console.log('❌ Erro em prescrições:', error.message);
  }
  
  // Testar histórico médico
  try {
    console.log('\n🏥 Testando /api/historico-medico/paciente/1');
    const historicoResponse = await fetch(`${API_BASE}/api/historico-medico/paciente/1`, { headers });
    const historicoData = await historicoResponse.json();
    console.log('Status:', historicoResponse.status);
    console.log('Dados:', JSON.stringify(historicoData, null, 2));
  } catch (error) {
    console.log('❌ Erro em histórico:', error.message);
  }
  
  // Testar usuários
  try {
    console.log('\n👥 Testando /api/usuarios');
    const usuariosResponse = await fetch(`${API_BASE}/api/usuarios`, { headers });
    const usuariosData = await usuariosResponse.json();
    console.log('Status:', usuariosResponse.status);
    console.log('Dados:', JSON.stringify(usuariosData, null, 2));
  } catch (error) {
    console.log('❌ Erro em usuários:', error.message);
  }
  
  // Testar consultas
  try {
    console.log('\n📅 Testando /api/consultas');
    const consultasResponse = await fetch(`${API_BASE}/api/consultas`, { headers });
    const consultasData = await consultasResponse.json();
    console.log('Status:', consultasResponse.status);
    console.log('Dados:', JSON.stringify(consultasData, null, 2));
  } catch (error) {
    console.log('❌ Erro em consultas:', error.message);
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando teste de APIs com autenticação...');
  
  const token = await fazerLogin();
  
  if (token) {
    console.log('✅ Login realizado com sucesso!');
    console.log('Token:', token.substring(0, 50) + '...');
    await testarAPIsComToken(token);
  } else {
    console.log('❌ Não foi possível fazer login. Testando sem autenticação...');
    
    // Testar algumas rotas sem autenticação
    try {
      console.log('\n🔓 Testando rota pública /api/auth/usuarios');
      const response = await fetch(`${API_BASE}/auth/usuarios`);
      console.log('Status:', response.status);
      const data = await response.json();
      console.log('Dados:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
  }
}

// Executar teste
main();