const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false
});

async function verificarPrescricoes() {
  try {
    console.log('🔍 Verificando dados de prescrições no banco...');
    
    // 1. Verificar se a tabela existe e sua estrutura
    console.log('\n📋 Estrutura da tabela prescricoes:');
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' 
      ORDER BY ordinal_position
    `);
    console.table(estrutura.rows);
    
    // 2. Contar total de prescrições
    console.log('\n📊 Total de prescrições:');
    const total = await pool.query('SELECT COUNT(*) as total FROM prescricoes');
    console.log(`Total: ${total.rows[0].total}`);
    
    // 3. Listar algumas prescrições
    console.log('\n📝 Primeiras 5 prescrições:');
    const prescricoes = await pool.query(`
      SELECT id, consulta_id, medico_id, medicamentos, orientacoes, ativa, criado_em 
      FROM prescricoes 
      ORDER BY criado_em DESC 
      LIMIT 5
    `);
    console.table(prescricoes.rows);
    
    // 4. Verificar se existem consultas relacionadas
    console.log('\n🏥 Verificando consultas relacionadas:');
    const consultasRelacionadas = await pool.query(`
      SELECT 
        p.id as prescricao_id,
        c.id as consulta_id,
        c.paciente_id,
        c.status as consulta_status
      FROM prescricoes p
      LEFT JOIN consultas c ON p.consulta_id = c.id
      LIMIT 5
    `);
    console.table(consultasRelacionadas.rows);
    
    // 5. Testar a query exata da API para admin
    console.log('\n🔍 Testando query da API (sem filtros de usuário):');
    const queryAPI = `
      SELECT 
        p.id, p.consulta_id, p.medico_id, c.paciente_id, p.medicamentos, 
        p.orientacoes as observacoes_gerais, p.ativa as status, p.criado_em, p.criado_em as atualizado_em,
        pac.nome as paciente_nome, pac.email as paciente_email,
        med.nome as medico_nome, med.tipo as especialidade, '' as crm,
        c.data_hora as data_consulta, '' as horario
      FROM prescricoes p
      JOIN consultas c ON p.consulta_id = c.id
      JOIN usuarios pac ON c.paciente_id = pac.id
      JOIN usuarios med ON p.medico_id = med.id
      WHERE 1=1
      ORDER BY p.criado_em DESC
      LIMIT 5
    `;
    
    const resultadoAPI = await pool.query(queryAPI);
    console.log(`Resultados da query da API: ${resultadoAPI.rows.length} registros`);
    if (resultadoAPI.rows.length > 0) {
      console.table(resultadoAPI.rows.map(row => ({
        id: row.id,
        paciente: row.paciente_nome,
        medico: row.medico_nome,
        status: row.status,
        criado_em: row.criado_em
      })));
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar prescrições:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

verificarPrescricoes();