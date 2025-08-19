import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração da conexão com PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: false
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Executando migração do banco de dados...');
    
    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', '001_create_database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado:', sqlPath);
    
    // Executar o SQL
    await client.query(sqlContent);
    
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar tabelas criadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao executar migração:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar migração
runMigration()
  .then(() => {
    console.log('🎉 Processo de migração concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha na migração:', error);
    process.exit(1);
  });