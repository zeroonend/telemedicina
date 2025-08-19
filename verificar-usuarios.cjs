const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
});

async function verificarUsuarios() {
  console.log('🔍 VERIFICANDO USUÁRIOS NO BANCO');
  console.log('================================');
  
  try {
    // Listar todos os usuários
    const result = await pool.query(
      'SELECT id, name, email, user_type FROM users ORDER BY user_type, name'
    );
    
    console.log('Usuários encontrados:');
    console.log('=====================');
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Tipo: ${user.user_type}`);
      console.log(`   ID: ${user.id}`);
      console.log('---');
    });
    
    console.log(`\nTotal de usuários: ${result.rows.length}`);
    
    // Contar por tipo
    const tipos = {};
    result.rows.forEach(user => {
      tipos[user.user_type] = (tipos[user.user_type] || 0) + 1;
    });
    
    console.log('\nPor tipo:');
    Object.entries(tipos).forEach(([tipo, count]) => {
      console.log(`  ${tipo}: ${count}`);
    });
    
  } catch (error) {
    console.error('Erro ao verificar usuários:', error.message);
  } finally {
    await pool.end();
  }
}

verificarUsuarios();