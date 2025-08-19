import { Pool } from 'pg';

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678',
  ssl: false
});

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura do banco de dados...');
    
    // Verificar se a tabela consultas existe
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'consultas'
      );
    `);
    
    console.log('📋 Tabela consultas existe:', tableExists.rows[0].exists);
    
    if (tableExists.rows[0].exists) {
      // Verificar estrutura da tabela users
      console.log('\n👤 Verificando estrutura da tabela users...');
      const usersStructure = await pool.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'users' AND table_schema = 'public'
         ORDER BY ordinal_position`
      );
      
      if (usersStructure.rows.length > 0) {
        console.log('✅ Tabela users encontrada:');
        usersStructure.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      } else {
        console.log('❌ Tabela users não encontrada');
      }
      
      // Verificar estrutura da tabela consultas
      console.log('\n📋 Verificando estrutura da tabela consultas...');
      const consultasStructure = await pool.query(
        `SELECT column_name, data_type, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'consultas' AND table_schema = 'public'
         ORDER BY ordinal_position`
      );
      
      if (consultasStructure.rows.length > 0) {
        console.log('✅ Tabela consultas encontrada:');
        consultasStructure.rows.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      } else {
         console.log('❌ Tabela consultas não encontrada');
       }
       
       // Verificar estrutura da tabela prescricoes
       console.log('\n💊 Verificando estrutura da tabela prescricoes...');
       const prescricoesStructure = await pool.query(
         `SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'prescricoes' AND table_schema = 'public'
          ORDER BY ordinal_position`
       );
       
       if (prescricoesStructure.rows.length > 0) {
         console.log('✅ Tabela prescricoes encontrada:');
         prescricoesStructure.rows.forEach(col => {
           console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
         });
       } else {
         console.log('❌ Tabela prescricoes não encontrada');
       }
       
       // Verificar estrutura da tabela historico_medico
       console.log('\n📋 Verificando estrutura da tabela historico_medico...');
       const historicoStructure = await pool.query(
         `SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_name = 'historico_medico' AND table_schema = 'public'
          ORDER BY ordinal_position`
       );
       
       if (historicoStructure.rows.length > 0) {
         console.log('✅ Tabela historico_medico encontrada:');
         historicoStructure.rows.forEach(col => {
           console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
         });
       } else {
         console.log('❌ Tabela historico_medico não encontrada');
       }
     }
    
    // Verificar todas as tabelas existentes
    const allTables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📚 Todas as tabelas no banco:');
    allTables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseStructure();