const { Pool } = require('pg');

// Configuração do banco de dados (mesma da API)
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
  ssl: false,
});

async function verificarEstrutura() {
  try {
    console.log('🔍 Verificando estrutura da tabela usuarios...');
    
    // Verificar colunas da tabela usuarios
    const queryEstrutura = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `;
    
    const result = await pool.query(queryEstrutura);
    
    console.log('📋 Colunas da tabela usuarios:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type}) - Nullable: ${row.is_nullable}`);
    });
    
    // Verificar se existem usuários
    console.log('\n🔍 Verificando usuários existentes...');
    const queryUsuarios = 'SELECT id, nome, email, tipo, especialidade FROM usuarios LIMIT 10';
    const usuarios = await pool.query(queryUsuarios);
    
    console.log(`📊 Total de usuários encontrados: ${usuarios.rows.length}`);
    usuarios.rows.forEach((usuario, index) => {
      console.log(`${index + 1}. ${usuario.nome} (${usuario.email}) - Tipo: ${usuario.tipo} - Especialidade: ${usuario.especialidade || 'N/A'}`);
    });
    
    // Buscar especificamente o médico teste
    console.log('\n🔍 Buscando médico teste...');
    const queryMedicoTeste = "SELECT * FROM usuarios WHERE email = 'medico@teste.com'";
    const medicoTeste = await pool.query(queryMedicoTeste);
    
    if (medicoTeste.rows.length > 0) {
      console.log('✅ Médico teste encontrado:');
      console.log(medicoTeste.rows[0]);
    } else {
      console.log('❌ Médico teste não encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

verificarEstrutura();