const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function checkUsersStructure() {
  try {
    console.log('📋 Verificando estrutura da tabela users...');
    
    // Verificar estrutura da tabela users
    const usersStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura da tabela users:');
    usersStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar alguns dados da tabela users
    const usersData = await pool.query('SELECT * FROM users LIMIT 2');
    console.log('\n👥 Exemplo de dados da tabela users:');
    usersData.rows.forEach(user => {
      console.log('Usuário:', JSON.stringify(user, null, 2));
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

checkUsersStructure();