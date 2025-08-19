// Teste do sistema de agendamento de consultas
const testConsultas = async () => {
  try {
    console.log('📅 Testando sistema de agendamento de consultas...');
    
    // Primeiro, fazer login para obter token
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@email.com',
        password: '123456'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('🔐 Login realizado:', loginData.success);
    
    if (!loginData.token) {
      console.error('❌ Falha no login');
      return;
    }
    
    const token = loginData.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Teste 1: Listar consultas
    console.log('\n1️⃣ Testando listagem de consultas...');
    const listarResponse = await fetch('http://localhost:3002/api/consultas', {
      headers
    });
    const consultas = await listarResponse.json();
    console.log('📋 Consultas encontradas:', consultas);
    
    // Teste 2: Criar nova consulta
    console.log('\n2️⃣ Testando criação de consulta...');
    const novaConsulta = {
      medico_id: '550e8400-e29b-41d4-a716-446655440000', // ID fictício
      data_hora: '2024-12-20T14:00:00.000Z',
      tipo: 'online',
      observacoes: 'Consulta de rotina'
    };
    
    const criarResponse = await fetch('http://localhost:3002/api/consultas', {
      method: 'POST',
      headers,
      body: JSON.stringify(novaConsulta)
    });
    
    const consultaCriada = await criarResponse.json();
    console.log('✅ Consulta criada:', consultaCriada);
    
    // Teste 3: Buscar consultas por paciente
    console.log('\n3️⃣ Testando busca por paciente...');
    const pacienteId = loginData.user.id;
    const pacienteResponse = await fetch(`http://localhost:3002/api/consultas/paciente/${pacienteId}`, {
      headers
    });
    
    const consultasPaciente = await pacienteResponse.json();
    console.log('👤 Consultas do paciente:', consultasPaciente);
    
    // Teste 4: Verificar disponibilidade
    console.log('\n4️⃣ Testando verificação de disponibilidade...');
    const disponibilidade = await fetch('http://localhost:3002/api/consultas/disponibilidade?medico_id=550e8400-e29b-41d4-a716-446655440000&data=2024-12-20', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.json());
    console.log('🕐 Disponibilidade:', disponibilidade);
    
    console.log('\n✅ Teste de consultas concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste de consultas:', error);
  }
};

testConsultas();