import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

// Configuração da conexão PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Configurações de timeout para diagnóstico
  connectionTimeoutMillis: 10000, // 10 segundos
  idleTimeoutMillis: 30000,
  max: 1 // Apenas uma conexão para teste
});

async function testConnection() {
  console.log('🔍 Testando conexão com PostgreSQL...');
  console.log(`📍 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
  console.log(`🗄️  Database: ${process.env.DB_NAME}`);
  console.log(`👤 User: ${process.env.DB_USER}`);
  console.log('⏱️  Timeout: 10 segundos\n');

  try {
    // Tenta conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Testa uma query simples
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('📊 Informações do banco:');
    console.log(`   Hora atual: ${result.rows[0].current_time}`);
    console.log(`   Versão PostgreSQL: ${result.rows[0].pg_version}`);
    
    // Verifica se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas encontradas:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('   ⚠️  Nenhuma tabela encontrada (banco vazio)');
    }
    
    client.release();
    console.log('\n🎉 Teste de conexão concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensagem: ${error.message}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('\n🔧 Possíveis soluções:');
      console.error('   1. Verificar se o IP do servidor está correto');
      console.error('   2. Verificar se o PostgreSQL está rodando na porta 5432');
      console.error('   3. Verificar firewall do servidor');
      console.error('   4. Verificar se o PostgreSQL aceita conexões externas');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n🔧 Possíveis soluções:');
      console.error('   1. PostgreSQL não está rodando');
      console.error('   2. Porta 5432 não está aberta');
      console.error('   3. Verificar configuração do postgresql.conf');
    } else if (error.code === '28P01') {
      console.error('\n🔧 Possíveis soluções:');
      console.error('   1. Verificar usuário e senha');
      console.error('   2. Verificar configuração do pg_hba.conf');
    }
  } finally {
    await pool.end();
  }
}

// Executa o teste
testConnection().catch(console.error);