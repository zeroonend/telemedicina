const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'postgres',
  host: '138.197.105.123',
  database: 'telemedicina',
  password: 'postgres123',
  port: 5432,
});

async function verificarConsultasPaciente() {
  try {
    console.log('🔍 Verificando consultas do paciente de teste...');
    
    // Primeiro, vamos buscar o ID do paciente de teste
    const pacienteQuery = `
      SELECT id, nome, email, tipo 
      FROM usuarios 
      WHERE email = 'paciente@teste.com'
    `;
    
    const pacienteResult = await pool.query(pacienteQuery);
    
    if (pacienteResult.rows.length === 0) {
      console.log('❌ Paciente de teste não encontrado!');
      return;
    }
    
    const paciente = pacienteResult.rows[0];
    console.log('✅ Paciente encontrado:', {
      id: paciente.id,
      nome: paciente.nome,
      email: paciente.email,
      tipo: paciente.tipo
    });
    
    // Agora vamos buscar as consultas do paciente
    const consultasQuery = `
      SELECT 
        c.id,
        c.paciente_id,
        c.medico_id,
        c.data_hora,
        c.status,
        c.especialidade,
        c.observacoes,
        c.valor,
        c.criado_em,
        m.nome as medico_nome,
        m.email as medico_email
      FROM consultas c
      LEFT JOIN usuarios m ON c.medico_id = m.id
      WHERE c.paciente_id = $1
      ORDER BY c.data_hora DESC
    `;
    
    const consultasResult = await pool.query(consultasQuery, [paciente.id]);
    
    console.log(`\n📋 Consultas encontradas: ${consultasResult.rows.length}`);
    
    if (consultasResult.rows.length === 0) {
      console.log('\n⚠️  Nenhuma consulta encontrada para o paciente de teste.');
      console.log('\n💡 Vamos criar uma consulta de teste...');
      
      // Buscar um médico ativo para criar a consulta
      const medicoQuery = `
        SELECT id, nome, email 
        FROM usuarios 
        WHERE tipo = 'medico' AND ativo = true
        LIMIT 1
      `;
      
      const medicoResult = await pool.query(medicoQuery);
      
      if (medicoResult.rows.length === 0) {
        console.log('❌ Nenhum médico ativo encontrado!');
        return;
      }
      
      const medico = medicoResult.rows[0];
      console.log('👨‍⚕️ Médico encontrado:', medico);
      
      // Criar uma consulta de teste
      const dataConsulta = new Date();
      dataConsulta.setDate(dataConsulta.getDate() + 1); // Amanhã
      dataConsulta.setHours(14, 0, 0, 0); // 14:00
      
      const criarConsultaQuery = `
        INSERT INTO consultas (
          paciente_id, 
          medico_id, 
          data_hora, 
          status, 
          especialidade, 
          observacoes, 
          valor
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const novaConsulta = await pool.query(criarConsultaQuery, [
        paciente.id,
        medico.id,
        dataConsulta,
        'agendada',
        'Clínica Geral',
        'Consulta de teste criada automaticamente',
        150.00
      ]);
      
      console.log('✅ Consulta de teste criada:', {
        id: novaConsulta.rows[0].id,
        data_hora: novaConsulta.rows[0].data_hora,
        status: novaConsulta.rows[0].status,
        especialidade: novaConsulta.rows[0].especialidade,
        valor: novaConsulta.rows[0].valor
      });
      
    } else {
      console.log('\n📋 Lista de consultas:');
      consultasResult.rows.forEach((consulta, index) => {
        console.log(`\n${index + 1}. Consulta ID: ${consulta.id}`);
        console.log(`   📅 Data/Hora: ${consulta.data_hora}`);
        console.log(`   📊 Status: ${consulta.status}`);
        console.log(`   🏥 Especialidade: ${consulta.especialidade}`);
        console.log(`   👨‍⚕️ Médico: ${consulta.medico_nome} (${consulta.medico_email})`);
        console.log(`   💰 Valor: R$ ${consulta.valor}`);
        if (consulta.observacoes) {
          console.log(`   📝 Observações: ${consulta.observacoes}`);
        }
        console.log(`   🕐 Criado em: ${consulta.criado_em}`);
      });
    }
    
    // Verificar também a estrutura da tabela consultas
    console.log('\n🔍 Verificando estrutura da tabela consultas...');
    const estruturaQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'consultas'
      ORDER BY ordinal_position
    `;
    
    const estruturaResult = await pool.query(estruturaQuery);
    console.log('\n📋 Colunas da tabela consultas:');
    estruturaResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar consultas:', error);
  } finally {
    await pool.end();
  }
}

verificarConsultasPaciente();