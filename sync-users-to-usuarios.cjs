const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function syncUsersToUsuarios() {
  try {
    console.log('🔄 Sincronizando dados da tabela users para usuarios...');
    
    // Primeiro, vamos verificar a estrutura da tabela usuarios
    const usuariosStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela usuarios:');
    usuariosStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar dados existentes em users
    const usersData = await pool.query('SELECT * FROM users ORDER BY created_at');
    console.log(`\n👥 Encontrados ${usersData.rows.length} usuários na tabela users`);
    
    // Verificar dados existentes em usuarios
    const usuariosData = await pool.query('SELECT * FROM usuarios');
    console.log(`👥 Encontrados ${usuariosData.rows.length} usuários na tabela usuarios`);
    
    // Limpar tabela usuarios antes de sincronizar
    await pool.query('DELETE FROM usuarios');
    console.log('🗑️ Tabela usuarios limpa');
    
    // Inserir dados de users em usuarios (mapeando campos corretamente)
    for (const user of usersData.rows) {
      try {
        await pool.query(`
          INSERT INTO usuarios (id, email, senha_hash, nome, tipo, telefone, ativo, criado_em, atualizado_em)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          user.id,
          user.email,
          user.password_hash, // password_hash -> senha_hash
          user.name,          // name -> nome
          user.user_type,     // user_type -> tipo
          user.phone,         // phone -> telefone
          user.is_active,     // is_active -> ativo
          user.created_at,    // created_at -> criado_em
          user.updated_at     // updated_at -> atualizado_em
        ]);
        console.log(`✅ Usuário sincronizado: ${user.email} (${user.user_type})`);
      } catch (err) {
        console.error(`❌ Erro ao sincronizar usuário ${user.email}:`, err.message);
      }
    }
    
    // Verificar resultado final
    const finalCount = await pool.query('SELECT COUNT(*) as count FROM usuarios');
    console.log(`\n🎉 Sincronização concluída! ${finalCount.rows[0].count} usuários na tabela usuarios`);
    
  } catch (error) {
    console.error('❌ Erro durante sincronização:', error);
  } finally {
    await pool.end();
  }
}

syncUsersToUsuarios();