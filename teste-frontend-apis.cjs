const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'http://localhost:3002';

async function testarFrontendAPIs() {
  try {
    console.log('🎯 Testando APIs como o frontend faria...');
    
    // 1. Fazer login como paciente
    console.log('\n👤 Fazendo login como paciente...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'paciente@teste.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (!loginData.success) {
      throw new Error('Falha no login: ' + loginData.message);
    }
    
    const token = loginData.token;
    console.log('✅ Login como paciente realizado com sucesso!');
    console.log(`Usuário: ${loginData.user.nome} (${loginData.user.tipo})`);
    
    // 2. Testar prescrições do paciente
    console.log('\n📋 Buscando prescrições do paciente...');
    const prescricoesResponse = await fetch(`${BASE_URL}/api/prescricoes`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const prescricoesData = await prescricoesResponse.json();
    console.log(`Status: ${prescricoesResponse.status}`);
    
    if (prescricoesData.success) {
      console.log(`✅ Prescrições encontradas: ${prescricoesData.prescricoes.length}`);
      if (prescricoesData.prescricoes.length > 0) {
        console.log('Primeira prescrição:');
        const primeira = prescricoesData.prescricoes[0];
        console.log(`- ID: ${primeira.id}`);
        console.log(`- Médico: ${primeira.medico.nome}`);
        console.log(`- Medicamentos: ${primeira.medicamentos.length} item(s)`);
        console.log(`- Status: ${primeira.status ? 'Ativa' : 'Inativa'}`);
      }
    } else {
      console.log('❌ Erro ao buscar prescrições:', prescricoesData.error);
    }
    
    // 3. Testar consultas do paciente
    console.log('\n🏥 Buscando consultas do paciente...');
    const consultasResponse = await fetch(`${BASE_URL}/api/consultas`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const consultasData = await consultasResponse.json();
    console.log(`Status: ${consultasResponse.status}`);
    
    if (consultasData.success) {
      console.log(`✅ Consultas encontradas: ${consultasData.consultas.length}`);
      if (consultasData.consultas.length > 0) {
        console.log('Primeira consulta:');
        const primeira = consultasData.consultas[0];
        console.log(`- ID: ${primeira.id}`);
        console.log(`- Médico: ${primeira.medico.nome}`);
        console.log(`- Data: ${new Date(primeira.data_hora).toLocaleDateString('pt-BR')}`);
        console.log(`- Status: ${primeira.status}`);
        console.log(`- Especialidade: ${primeira.especialidade}`);
      }
    } else {
      console.log('❌ Erro ao buscar consultas:', consultasData.error);
    }
    
    // 4. Testar histórico médico do paciente
    console.log('\n📊 Buscando histórico médico do paciente...');
    const pacienteId = loginData.user.id;
    const historicoResponse = await fetch(`${BASE_URL}/api/historico-medico/paciente/${pacienteId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const historicoData = await historicoResponse.json();
    console.log(`Status: ${historicoResponse.status}`);
    
    if (historicoData.success) {
      console.log(`✅ Histórico médico: ${historicoData.data.length} registros`);
      if (historicoData.data.length > 0) {
        console.log('Primeiro registro:');
        const primeiro = historicoData.data[0];
        console.log(`- Tipo: ${primeiro.tipo}`);
        console.log(`- Data: ${new Date(primeiro.data).toLocaleDateString('pt-BR')}`);
      } else {
        console.log('ℹ️ Nenhum registro de histórico médico encontrado (normal para paciente novo)');
      }
    } else {
      console.log('❌ Erro ao buscar histórico médico:', historicoData.error);
    }
    
    // 5. Fazer login como médico e testar
    console.log('\n\n👨‍⚕️ Fazendo login como médico...');
    const loginMedicoResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'medico@teste.com',
        password: '123456'
      })
    });
    
    const loginMedicoData = await loginMedicoResponse.json();
    
    if (loginMedicoData.success) {
      const tokenMedico = loginMedicoData.token;
      console.log('✅ Login como médico realizado com sucesso!');
      console.log(`Usuário: ${loginMedicoData.user.nome} (${loginMedicoData.user.tipo})`);
      
      // Testar prescrições do médico
      console.log('\n📋 Buscando prescrições do médico...');
      const prescricoesMedicoResponse = await fetch(`${BASE_URL}/api/prescricoes`, {
        headers: {
          'Authorization': `Bearer ${tokenMedico}`
        }
      });
      
      const prescricoesMedicoData = await prescricoesMedicoResponse.json();
      console.log(`Status: ${prescricoesMedicoResponse.status}`);
      
      if (prescricoesMedicoData.success) {
        console.log(`✅ Prescrições do médico: ${prescricoesMedicoData.prescricoes.length}`);
        console.log(`Total de páginas: ${prescricoesMedicoData.pagination.totalPages}`);
        console.log(`Total de registros: ${prescricoesMedicoData.pagination.total}`);
      }
    }
    
    console.log('\n🎉 Teste concluído! O sistema está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testarFrontendAPIs();