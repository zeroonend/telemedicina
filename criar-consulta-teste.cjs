const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'telemedicina',
  password: 'postgres',
  port: 5432,
});

async function criarConsultaTeste() {
  try {
    // Buscar um médico e um paciente existentes
    const medicos = await pool.query("SELECT id FROM usuarios WHERE tipo = 'medico' LIMIT 1");
    const pacientes = await pool.query("SELECT id FROM usuarios WHERE tipo = 'paciente' LIMIT 1");
    
    if (medicos.rows.length === 0 || pacientes.rows.length === 0) {
      console.log('❌ Não há médicos ou pacientes cadastrados');
      return;
    }
    
    const medicoId = medicos.rows[0].id;
    const pacienteId = pacientes.rows[0].id;
    
    // Criar uma consulta para hoje + 1 hora
    const dataConsulta = new Date();
    dataConsulta.setHours(dataConsulta.getHours() + 1);
    
    const result = await pool.query(
      `INSERT INTO consultas (paciente_id, medico_id, data_hora, especialidade, status, valor) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [pacienteId, medicoId, dataConsulta, 'Clínica Geral', 'agendada', 100.00]
    );
    
    console.log('✅ Consulta de teste criada com ID:', result.rows[0].id);
    console.log('📅 Data/Hora:', dataConsulta.toLocaleString('pt-BR'));
    console.log('👨‍⚕️ Médico ID:', medicoId);
    console.log('👤 Paciente ID:', pacienteId);
    
  } catch (error) {
    console.error('❌ Erro ao criar consulta de teste:', error);
  } finally {
    await pool.end();
  }
}

criarConsultaTeste();