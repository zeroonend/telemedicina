import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para verificar a estrutura da tabela consultas
 * e identificar problemas com triggers
 */
async function verificarTabela() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'telemedicina',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔍 Verificando estrutura da tabela consultas...');
    
    // Verificar colunas da tabela
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'consultas' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Colunas da tabela consultas:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar triggers
    const triggers = await pool.query(`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers 
      WHERE event_object_table = 'consultas'
    `);
    
    console.log('\n🔧 Triggers da tabela consultas:');
    if (triggers.rows.length === 0) {
      console.log('  - Nenhum trigger encontrado');
    } else {
      triggers.rows.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}: ${trigger.event_manipulation}`);
        console.log(`    Action: ${trigger.action_statement}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão encerrada.');
  }
}

// Executar o script
verificarTabela()
  .then(() => {
    console.log('🏁 Verificação concluída.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });