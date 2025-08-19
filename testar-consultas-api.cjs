const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3002/api';

async function testarConsultasAPI() {
  try {
    console.log('🔐 Fazendo login como paciente de teste...');
    
    // Fazer login
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'paciente@teste.com',
        password: '123456'
      })
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('❌ Erro no login:', errorText);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    console.log('👤 Usuário:', loginData.user.name);
    console.log('🎫 Token obtido');
    
    const token = loginData.token;
    
    // Buscar consultas
    console.log('\n📋 Buscando consultas do paciente...');
    
    const consultasResponse = await fetch(`${API_BASE_URL}/consultas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!consultasResponse.ok) {
      const errorText = await consultasResponse.text();
      console.log('❌ Erro ao buscar consultas:', errorText);
      return;
    }
    
    const consultasData = await consultasResponse.json();
    console.log('✅ Resposta da API de consultas recebida!');
    console.log('📊 Dados:', JSON.stringify(consultasData, null, 2));
    
    if (consultasData.success && consultasData.consultas) {
      console.log(`\n📋 Total de consultas encontradas: ${consultasData.consultas.length}`);
      
      if (consultasData.consultas.length === 0) {
        console.log('\n⚠️  Nenhuma consulta encontrada para o paciente de teste.');
        console.log('💡 Isso explica por que a página /agenda-consulta está vazia.');
        console.log('\n🔧 Para testar a funcionalidade:');
        console.log('   1. Acesse /agendar-consulta');
        console.log('   2. Agende uma consulta com o médico de teste');
        console.log('   3. Depois acesse /agenda-consulta para ver a consulta listada');
      } else {
        console.log('\n📋 Lista de consultas:');
        consultasData.consultas.forEach((consulta, index) => {
          console.log(`\n${index + 1}. Consulta ID: ${consulta.id}`);
          console.log(`   📅 Data/Hora: ${consulta.data_hora}`);
          console.log(`   📊 Status: ${consulta.status}`);
          console.log(`   🏥 Especialidade: ${consulta.especialidade}`);
          console.log(`   👨‍⚕️ Médico: ${consulta.medico?.nome || 'N/A'}`);
          console.log(`   💰 Valor: R$ ${consulta.valor}`);
        });
      }
    } else {
      console.log('❌ Formato de resposta inesperado:', consultasData);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar API:', error.message);
  }
}

testarConsultasAPI();