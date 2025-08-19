import pg from 'pg';

const { Pool } = pg;

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function verificarUsuarios() {
  try {
    console.log('👥 Verificando usuários de teste...');
    
    // Buscar todos os usuários
    const usuarios = await pool.query(
      'SELECT id, email, user_type, name FROM users ORDER BY created_at DESC'
    );
    
    console.log(`\n📊 Total de usuários: ${usuarios.rows.length}`);
    
    usuarios.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.user_type}) - ID: ${user.id} - Nome: ${user.name}`);
    });
    
    // Verificar especificamente os usuários de teste
    const usuariosTeste = await pool.query(
      'SELECT id, email, user_type FROM users WHERE email IN ($1, $2)',
      ['paciente@teste.com', 'medico@teste.com']
    );
    
    console.log('\n🔍 Usuários de teste encontrados:');
    usuariosTeste.rows.forEach(user => {
      console.log(`- ${user.email} (${user.user_type}) - ID: ${user.id}`);
    });
    
    // Verificar constraints da tabela consultas
    const constraints = await pool.query(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='consultas';
    `);
    
    console.log('\n🔗 Constraints de chave estrangeira da tabela consultas:');
    constraints.rows.forEach(constraint => {
      console.log(`- ${constraint.column_name} -> ${constraint.foreign_table_name}.${constraint.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await pool.end();
  }
}

verificarUsuarios();