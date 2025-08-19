const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:3002';

async function testarHistoricoMedico() {
  try {
    console.log('🚀 Testando histórico médico...');
    
    // 1. Fazer login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@telemedicina.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error('Falha no login: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login realizado com sucesso!');
    
    // 2. Buscar um paciente válido
    console.log('\n👤 Buscando pacientes disponíveis...');
    const usuariosResponse = await fetch(`${BASE_URL}/api/usuarios?tipo=paciente`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const usuariosData = await usuariosResponse.json();
    
    if (usuariosData.success && usuariosData.usuarios.length > 0) {
      const paciente = usuariosData.usuarios[0];
      console.log(`Paciente encontrado: ${paciente.nome} (ID: ${paciente.id})`);
      
      // 3. Testar histórico médico com ID válido
      console.log('\n🏥 Testando histórico médico com ID válido...');
      const historicoResponse = await fetch(`${BASE_URL}/api/historico-medico/paciente/${paciente.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`Status: ${historicoResponse.status}`);
      const historicoData = await historicoResponse.text();
      
      try {
        const historicoJson = JSON.parse(historicoData);
        console.log('Dados:', JSON.stringify(historicoJson, null, 2));
      } catch (e) {
        console.log('Resposta (texto):', historicoData);
      }
      
    } else {
      console.log('❌ Nenhum paciente encontrado');
    }
    
    // 4. Testar com ID inválido para ver o erro
    console.log('\n🧪 Testando com ID inválido (1)...');
    const historicoInvalidoResponse = await fetch(`${BASE_URL}/api/historico-medico/paciente/1`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${historicoInvalidoResponse.status}`);
    const historicoInvalidoData = await historicoInvalidoResponse.text();
    
    try {
      const historicoInvalidoJson = JSON.parse(historicoInvalidoData);
      console.log('Dados:', JSON.stringify(historicoInvalidoJson, null, 2));
    } catch (e) {
      console.log('Resposta (texto):', historicoInvalidoData);
    }
    
    // 5. Testar rota geral de histórico médico
    console.log('\n📋 Testando rota geral de histórico médico...');
    const historicoGeralResponse = await fetch(`${BASE_URL}/api/historico-medico`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${historicoGeralResponse.status}`);
    const historicoGeralData = await historicoGeralResponse.text();
    
    try {
      const historicoGeralJson = JSON.parse(historicoGeralData);
      console.log('Dados:', JSON.stringify(historicoGeralJson, null, 2));
    } catch (e) {
      console.log('Resposta (texto):', historicoGeralData);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testarHistoricoMedico();