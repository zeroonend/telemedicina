import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3002/api';

async function testarPrescricoesEHistorico() {
  console.log('💊 Testando sistema de prescrições digitais e histórico médico...');
  
  try {
    // 1. Fazer login como paciente para criar consulta
    console.log('🔐 Fazendo login como paciente para criar consulta...');
    const loginPacienteResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'paciente@teste.com',
        password: '123456'
      })
    });
    
    const loginPacienteData = await loginPacienteResponse.json();
    console.log('🔐 Login paciente realizado:', loginPacienteData.success);
    
    if (!loginPacienteData.success) {
      console.error('❌ Erro no login do paciente:', loginPacienteData.error);
      return;
    }
    
    const tokenPaciente = loginPacienteData.token;
    const headersPaciente = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenPaciente}`
    };
    
    // 2. Fazer login como médico para prescrições
    console.log('🔐 Fazendo login como médico...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'medico@teste.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Login médico realizado:', loginData.success);
    
    if (!loginData.success) {
      console.error('❌ Erro no login do médico:', loginData.error);
      return;
    }
    
    const token = loginData.token;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Testar listagem de prescrições
    console.log('\n1️⃣ Testando listagem de prescrições...');
    const prescricoesResponse = await fetch(`${API_BASE}/prescricoes`, {
      headers
    });
    const prescricoes = await prescricoesResponse.json();
    console.log('💊 Prescrições encontradas:', prescricoes);

    // 3. Testar criação de prescrição (como médico)
    console.log('\n2️⃣ Testando criação de prescrição...');
    
    // Primeiro vamos criar uma consulta fictícia para teste (como paciente)
      const consultaFicticia = {
        medico_id: '7e951e2b-4a41-48f3-ba0c-73a07dcd197c', // ID do médico
        data_hora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Amanhã
        especialidade: 'Clínica Geral',
        observacoes: 'Consulta de teste para prescrição',
        valor: 150.00
      };
     
     const consultaResponse = await fetch(`${API_BASE}/consultas`, {
       method: 'POST',
       headers: headersPaciente, // Usar token do paciente
       body: JSON.stringify(consultaFicticia)
     });
    const consultaCriada = await consultaResponse.json();
    console.log('📅 Consulta criada:', consultaCriada.success ? 'Sucesso' : consultaCriada.error);
    
    let consultaId;
    if (consultaCriada.success && consultaCriada.consulta) {
      consultaId = consultaCriada.consulta.id;
      
      // Atualizar status da consulta para 'em_andamento' para permitir prescrições
      const updateResponse = await fetch(`${API_BASE}/consultas/${consultaId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify({ status: 'em_andamento' })
      });
      
      const updateResult = await updateResponse.json();
      console.log('🔄 Status da consulta atualizado:', updateResult.success ? 'Sucesso' : updateResult.error || 'Erro');
    } else {
      consultaId = 'consulta-ficticia-123'; // Fallback para teste
    }
    
    const novaPrescricao = {
      consulta_id: consultaId,
      medicamentos: [
        {
          nome: 'Paracetamol 500mg',
          dosagem: '1 comprimido',
          frequencia: 'A cada 8 horas',
          duracao: '7 dias',
          observacoes: 'Tomar após as refeições'
        }
      ],
      orientacoes: 'Prescrição de teste via API - tomar com água'
    };
    
    const criarPrescricaoResponse = await fetch(`${API_BASE}/prescricoes`, {
      method: 'POST',
      headers,
      body: JSON.stringify(novaPrescricao)
    });
    const prescricaoCriada = await criarPrescricaoResponse.json();
    console.log('✅ Prescrição criada:', prescricaoCriada);

    // 4. Testar histórico médico do paciente
    console.log('\n3️⃣ Testando histórico médico...');
    const historicoResponse = await fetch(`${API_BASE}/historico-medico/paciente/46ff8a39-df54-449d-9ad5-1e0dc0ffe452`, {
      headers
    });
    const historico = await historicoResponse.json();
    console.log('📋 Histórico médico:', historico);

    // 5. Testar criação de entrada no histórico
    console.log('\n4️⃣ Testando criação de entrada no histórico...');
    const novaEntrada = {
      paciente_id: '46ff8a39-df54-449d-9ad5-1e0dc0ffe452',
      tipo: 'consulta',
      descricao: 'Consulta de rotina - Paciente apresenta sintomas leves de gripe',
      diagnostico: 'Resfriado comum',
      tratamento: 'Repouso e hidratação',
      observacoes: 'Retorno em 7 dias se sintomas persistirem'
    };
    
    const criarHistoricoResponse = await fetch(`${API_BASE}/historico-medico`, {
      method: 'POST',
      headers,
      body: JSON.stringify(novaEntrada)
    });
    const entradaCriada = await criarHistoricoResponse.json();
    console.log('✅ Entrada no histórico criada:', entradaCriada);

    console.log('\n✅ Teste de prescrições e histórico concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testarPrescricoesEHistorico();