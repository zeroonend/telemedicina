import dotenv from 'dotenv';
import { Client } from 'pg';

// Carrega as variáveis de ambiente
dotenv.config();

/**
 * Testa a conexão com o banco de dados PostgreSQL
 */
async function testConnection() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`🗄️ Database: ${process.env.DB_NAME}`);
    console.log(`👤 User: ${process.env.DB_USER}`);
    
    // Conecta ao banco
    await client.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Executa uma query simples para testar
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('⏰ Hora atual do servidor:', result.rows[0].current_time);
    console.log('🐘 Versão do PostgreSQL:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);
    
    // Lista as tabelas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas no banco:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  Nenhuma tabela encontrada.');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('💥 Detalhes do erro:', error);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.');
  }
}

// Executa o teste
testConnection();