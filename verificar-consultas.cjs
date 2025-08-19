const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
});

async function verificarConsultas() {
  console.log('🔍 VERIFICANDO CONSULTAS NO BANCO');
  console.log('=================================');
  
  try {
    // ID do médico de teste
    const medicoId = '7e951e2b-4a41-48f3-ba0c-73a07dcd197c';
    
    // Listar todas as consultas
    const todasConsultas = await pool.query(
      `SELECT c.id, c.medico_id, c.paciente_id, c.status, c.data_hora, 
              m.name as medico_nome, p.name as paciente_nome
       FROM consultas c
       JOIN users m ON c.medico_id = m.id
       JOIN users p ON c.paciente_id = p.id
       ORDER BY c.data_hora DESC`
    );
    
    console.log('Todas as consultas:');
    console.log('==================');
    
    if (todasConsultas.rows.length === 0) {
      console.log('❌ Nenhuma consulta encontrada no banco!');
    } else {
      todasConsultas.rows.forEach((consulta, index) => {
        console.log(`${index + 1}. ID: ${consulta.id}`);
        console.log(`   Médico: ${consulta.medico_nome} (${consulta.medico_id})`);
        console.log(`   Paciente: ${consulta.paciente_nome} (${consulta.paciente_id})`);
        console.log(`   Status: ${consulta.status}`);
        console.log(`   Data: ${consulta.data_hora}`);
        console.log('---');
      });
    }
    
    // Consultas específicas do médico de teste
    const consultasMedico = await pool.query(
      `SELECT c.id, c.paciente_id, c.status, c.data_hora, p.name as paciente_nome
       FROM consultas c
       JOIN users p ON c.paciente_id = p.id
       WHERE c.medico_id = $1
       ORDER BY c.data_hora DESC`,
      [medicoId]
    );
    
    console.log(`\nConsultas do médico de teste (${medicoId}):`);
    console.log('===========================================');
    
    if (consultasMedico.rows.length === 0) {
      console.log('❌ Nenhuma consulta encontrada para este médico!');
      
      // Criar uma consulta de teste
      console.log('\n🔧 Criando consulta de teste...');
      const pacienteId = '46ff8a39-df54-449d-9ad5-1e0dc0ffe452'; // Paciente Teste
      
      const novaConsulta = await pool.query(
        `INSERT INTO consultas (medico_id, paciente_id, data_hora, status, tipo, observacoes)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour', 'em_andamento', 'consulta', 'Consulta de teste para prescrições')
         RETURNING *`,
        [medicoId, pacienteId]
      );
      
      console.log('✅ Consulta de teste criada:');
      console.log(`   ID: ${novaConsulta.rows[0].id}`);
      console.log(`   Status: ${novaConsulta.rows[0].status}`);
      
    } else {
      consultasMedico.rows.forEach((consulta, index) => {
        console.log(`${index + 1}. ID: ${consulta.id}`);
        console.log(`   Paciente: ${consulta.paciente_nome} (${consulta.paciente_id})`);
        console.log(`   Status: ${consulta.status}`);
        console.log(`   Data: ${consulta.data_hora}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Erro ao verificar consultas:', error.message);
  } finally {
    await pool.end();
  }
}

verificarConsultas();