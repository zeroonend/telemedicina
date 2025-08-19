const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Configuração do banco de dados
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
  ssl: false
});

async function verificarSenhas() {
  try {
    console.log('🔍 Verificando senhas dos usuários...');
    
    // Buscar usuários com suas senhas
    const result = await pool.query(`
      SELECT id, email, nome, tipo, senha_hash, ativo 
      FROM usuarios 
      WHERE email IN ('admin@telemedicina.com', 'medico@teste.com', 'ilsonlara@gmail.com')
      ORDER BY tipo
    `);
    
    console.log(`\n📊 Usuários encontrados: ${result.rows.length}`);
    
    for (const user of result.rows) {
      console.log(`\n👤 ${user.nome} (${user.email})`);
      console.log(`   Tipo: ${user.tipo}`);
      console.log(`   Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
      console.log(`   Senha hash: ${user.senha_hash ? user.senha_hash.substring(0, 20) + '...' : 'NULL'}`);
      
      // Verificar se a senha é '123456'
      if (user.senha_hash) {
        try {
          const senhaCorreta = await bcrypt.compare('123456', user.senha_hash);
          console.log(`   Senha '123456' é válida: ${senhaCorreta ? '✅ SIM' : '❌ NÃO'}`);
          
          // Testar outras senhas comuns
          const senhasComuns = ['admin', 'password', 'teste', '12345', 'admin123'];
          for (const senha of senhasComuns) {
            const valida = await bcrypt.compare(senha, user.senha_hash);
            if (valida) {
              console.log(`   Senha '${senha}' é válida: ✅ SIM`);
            }
          }
        } catch (error) {
          console.log(`   Erro ao verificar senha: ${error.message}`);
        }
      }
    }
    
    // Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da tabela usuarios...');
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      AND column_name LIKE '%senha%' OR column_name LIKE '%password%'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Colunas relacionadas a senha:');
    estrutura.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (Nullable: ${col.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar senhas:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarSenhas();