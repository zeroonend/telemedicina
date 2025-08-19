const { Pool } = require('pg');

const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function verificarTabela() {
  try {
    // Verificar estrutura da tabela prescricoes
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' 
      ORDER BY ordinal_position;
    `);
    
    console.log('Estrutura da tabela prescricoes:');
    console.table(result.rows);
    
    // Verificar especificamente a coluna medicamentos
    const medicamentosCol = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' AND column_name = 'medicamentos';
    `);
    
    console.log('\nDetalhes da coluna medicamentos:');
    console.table(medicamentosCol.rows);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

verificarTabela();