import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Script para deletar todos os agendamentos de consultas
 * Remove todos os registros da tabela 'consultas' para permitir cadastro do zero
 */
async function limparConsultas() {
  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'telemedicina',
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🗑️  Iniciando limpeza da tabela consultas...');
    
    // Contar consultas antes da exclusão
    const countBefore = await pool.query('SELECT COUNT(*) FROM consultas');
    console.log(`📊 Total de consultas encontradas: ${countBefore.rows[0].count}`);

    if (parseInt(countBefore.rows[0].count) === 0) {
      console.log('✅ A tabela consultas já está vazia!');
      return;
    }

    // Desabilitar triggers temporariamente para evitar erros
    console.log('🔧 Desabilitando triggers temporariamente...');
    await pool.query('SET session_replication_role = replica');

    // Deletar todas as consultas
    console.log('🗑️  Deletando consultas...');
    const result = await pool.query('DELETE FROM consultas');
    console.log(`🗑️  ${result.rowCount} consultas deletadas com sucesso!`);

    // Reabilitar triggers
    console.log('🔧 Reabilitando triggers...');
    await pool.query('SET session_replication_role = DEFAULT');

    // Verificar se a tabela está vazia
    const countAfter = await pool.query('SELECT COUNT(*) FROM consultas');
    const consultasRestantes = parseInt(countAfter.rows[0].count);
    
    if (consultasRestantes === 0) {
      console.log('✅ Limpeza concluída! A tabela consultas está vazia.');
      console.log('🆕 Agora você pode cadastrar uma consulta do zero.');
    } else {
      console.log(`⚠️  Ainda restam ${consultasRestantes} consultas na tabela.`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar consultas:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Garantir que os triggers sejam reabilitados mesmo em caso de erro
    try {
      await pool.query('SET session_replication_role = DEFAULT');
      console.log('🔧 Triggers reabilitados após erro.');
    } catch (resetError) {
      console.error('⚠️  Erro ao reabilitar triggers:', resetError.message);
    }
  } finally {
    await pool.end();
    console.log('🔌 Conexão com banco de dados encerrada.');
  }
}

// Executar o script
limparConsultas()
  .then(() => {
    console.log('🏁 Script finalizado.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });