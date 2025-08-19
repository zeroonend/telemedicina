import fetch from 'node-fetch';

// Configurações
const API_BASE_URL = 'http://localhost:3002/api';

// Função para fazer login e obter token
async function fazerLogin() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'paciente@teste.com', // Email de um paciente de teste
        password: '123456'
      })
    });

    if (!response.ok) {
      throw new Error(`Erro no login: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Login realizado com sucesso');
    return data.token;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
}

// Função para buscar médicos disponíveis
async function buscarMedicos(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios?tipo=medico`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar médicos: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Médicos encontrados:', data.usuarios?.length || 0);
    return data.usuarios || [];
  } catch (error) {
    console.error('❌ Erro ao buscar médicos:', error.message);
    return [];
  }
}

// Função para agendar consulta
async function agendarConsulta(token, medicoId, dataHora, especialidade) {
  try {
    console.log('\n📅 Tentando agendar consulta...');
    console.log('Dados:', {
      medico_id: medicoId,
      data_hora: dataHora,
      especialidade: especialidade,
      observacoes: 'Teste de agendamento via script'
    });

    const response = await fetch(`${API_BASE_URL}/consultas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        medico_id: medicoId,
        data_hora: dataHora,
        especialidade: especialidade,
        observacoes: 'Teste de agendamento via script'
      })
    });

    console.log('Status da resposta:', response.status);
    
    const responseText = await response.text();
    console.log('Resposta completa:', responseText);

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${responseText}`);
    }

    const data = JSON.parse(responseText);
    console.log('✅ Consulta agendada com sucesso!');
    console.log('Dados da consulta:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Erro ao agendar consulta:', error.message);
    return null;
  }
}

// Função para verificar consultas criadas
async function verificarConsultas(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/consultas`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar consultas: ${response.status}`);
    }

    const data = await response.json();
    console.log('\n📋 Consultas encontradas:', data.consultas?.length || 0);
    
    if (data.consultas && data.consultas.length > 0) {
      console.log('Última consulta:', JSON.stringify(data.consultas[0], null, 2));
    }
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar consultas:', error.message);
    return null;
  }
}

// Função principal
async function testarAgendamento() {
  console.log('🚀 Iniciando teste de agendamento de consultas\n');

  // 1. Fazer login
  const token = await fazerLogin();
  if (!token) {
    console.log('❌ Não foi possível obter token. Encerrando teste.');
    return;
  }

  // 2. Buscar médicos
  const medicos = await buscarMedicos(token);
  if (medicos.length === 0) {
    console.log('❌ Nenhum médico encontrado. Encerrando teste.');
    return;
  }

  const primeiroMedico = medicos[0];
  console.log('👨‍⚕️ Médico selecionado:', primeiroMedico.name, '-', primeiroMedico.especialidade);

  // 3. Agendar consulta para amanhã em horário aleatório
  const amanha = new Date();
  amanha.setDate(amanha.getDate() + 1);
  amanha.setHours(Math.floor(Math.random() * 8) + 9, 0, 0, 0); // Horário aleatório entre 9h e 16h
  const dataHora = amanha.toISOString();

  const consulta = await agendarConsulta(
    token,
    primeiroMedico.id,
    dataHora,
    primeiroMedico.especialidade || 'Clínica Geral'
  );

  // 4. Verificar se a consulta foi criada
  if (consulta) {
    console.log('\n🔍 Verificando se a consulta foi persistida...');
    await verificarConsultas(token);
  }

  console.log('\n✅ Teste concluído!');
}

// Executar teste
testarAgendamento().catch(console.error);