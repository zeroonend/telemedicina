// Script para aplicar migração do histórico médico
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678',
  ssl: false
});

async function applyMigration() {
  try {
    console.log('🔄 Conectando ao banco de dados...');
    
    // Ler o arquivo de migração
    const migrationPath = path.join(__dirname, '../../supabase/migrations/002_update_historico_medico.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Aplicando migração do histórico médico...');
    
    // Executar a migração
    await pool.query(migrationSQL);
    
    console.log('✅ Migração aplicada com sucesso!');
    console.log('📋 Campos adicionados à tabela historico_medico:');
    console.log('   - exames (TEXT)');
    console.log('   - observacoes (TEXT)');
    console.log('   - medicamentos (JSONB)');
    console.log('   - atualizado_em (TIMESTAMP)');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();