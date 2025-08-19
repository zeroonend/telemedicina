const fetch = require('node-fetch');

// Função para testar a API de listagem de médicos
async function testarAPIListagemMedicos() {
  try {
    console.log('🔍 Testando API de listagem de médicos...');
    
    // Primeiro, fazer login como paciente para obter token
    console.log('\n1. Fazendo login como paciente teste...');
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
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
      console.log('❌ Erro no login:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login realizado com sucesso!');
    console.log('   Token obtido:', loginData.token ? 'Sim' : 'Não');
    
    // Agora testar a listagem de médicos
    console.log('\n2. Testando listagem de médicos...');
    const medicosResponse = await fetch('http://localhost:3002/api/usuarios?tipo=medico', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!medicosResponse.ok) {
      console.log('❌ Erro na listagem de médicos:', await medicosResponse.text());
      return;
    }
    
    const medicosData = await medicosResponse.json();
    console.log('✅ API de listagem funcionando!');
    console.log('📋 Médicos encontrados:', medicosData.usuarios?.length || 0);
    
    if (medicosData.usuarios && medicosData.usuarios.length > 0) {
      medicosData.usuarios.forEach((medico, index) => {
        console.log(`${index + 1}. ${medico.nome} (${medico.email})`);
        console.log(`   - Especialidade: ${medico.especialidade || 'Não informada'}`);
        console.log(`   - CRM: ${medico.crm || 'Não informado'}`);
        console.log(`   - Ativo: ${medico.ativo}`);
      });
    } else {
      console.log('⚠️  Nenhum médico encontrado na API!');
    }
    
    // Testar também sem filtro de tipo
    console.log('\n3. Testando listagem geral de usuários...');
    const usuariosResponse = await fetch('http://localhost:3002/api/usuarios', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (usuariosResponse.ok) {
      const usuariosData = await usuariosResponse.json();
      console.log('✅ API de usuários funcionando!');
      console.log('📋 Total de usuários:', usuariosData.usuarios?.length || 0);
      
      if (usuariosData.usuarios) {
        const medicos = usuariosData.usuarios.filter(u => u.tipo === 'medico');
        console.log('👨‍⚕️ Médicos na listagem geral:', medicos.length);
      }
    } else {
      console.log('❌ Erro na listagem geral:', await usuariosResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar o teste
testarAPIListagemMedicos();