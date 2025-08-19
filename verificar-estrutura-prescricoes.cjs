const { Pool } = require('pg');

// Configuração do banco (mesma da API)
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function verificarEstrutura() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA PRESCRICOES');
    console.log('==============================================');
    
    // Verificar estrutura da tabela
    const estrutura = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' 
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Estrutura da tabela prescricoes:');
    estrutura.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });
    
    // Verificar algumas consultas existentes para ver o formato dos UUIDs
    console.log('\n🔍 Exemplos de consultas existentes:');
    const consultas = await pool.query(`
      SELECT id, medico_id, paciente_id, status 
      FROM consultas 
      LIMIT 5;
    `);
    
    consultas.rows.forEach(consulta => {
      console.log(`- ID: ${consulta.id} | Médico: ${consulta.medico_id} | Paciente: ${consulta.paciente_id} | Status: ${consulta.status}`);
    });
    
    // Verificar prescrições existentes
    console.log('\n🔍 Exemplos de prescrições existentes:');
    const prescricoes = await pool.query(`
      SELECT id, consulta_id, medico_id, medicamentos 
      FROM prescricoes 
      LIMIT 3;
    `);
    
    prescricoes.rows.forEach(prescricao => {
      console.log(`- ID: ${prescricao.id}`);
      console.log(`  Consulta: ${prescricao.consulta_id}`);
      console.log(`  Médico: ${prescricao.medico_id}`);
      console.log(`  Medicamentos: ${JSON.stringify(prescricao.medicamentos)}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
    console.log('\n✅ Conexão fechada');
  }
}

verificarEstrutura();