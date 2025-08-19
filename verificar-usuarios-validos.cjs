const { Pool } = require('pg');

// Configuração do banco de dados (usando as mesmas configurações do .env)
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
  ssl: false
});

async function verificarUsuarios() {
  try {
    console.log('🔍 Verificando usuários no banco de dados...');
    
    // Buscar todos os usuários
    const result = await pool.query(`
      SELECT id, email, nome, tipo, ativo, criado_em 
      FROM usuarios 
      ORDER BY tipo, nome
    `);
    
    console.log(`\n📊 Total de usuários: ${result.rows.length}`);
    console.log('\n👥 Lista de usuários:');
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome} (${user.email})`);
      console.log(`   Tipo: ${user.tipo} | Ativo: ${user.ativo ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${user.criado_em}`);
      console.log('---');
    });
    
    // Verificar se existe algum admin
    const admins = result.rows.filter(user => user.tipo === 'admin');
    console.log(`\n🔑 Administradores encontrados: ${admins.length}`);
    
    if (admins.length > 0) {
      console.log('\n📋 Administradores:');
      admins.forEach(admin => {
        console.log(`- ${admin.nome} (${admin.email}) - Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
      });
    }
    
    // Verificar médicos
    const medicos = result.rows.filter(user => user.tipo === 'medico');
    console.log(`\n👨‍⚕️ Médicos encontrados: ${medicos.length}`);
    
    if (medicos.length > 0) {
      console.log('\n📋 Médicos:');
      medicos.forEach(medico => {
        console.log(`- ${medico.nome} (${medico.email}) - Ativo: ${medico.ativo ? 'Sim' : 'Não'}`);
      });
    }
    
    // Verificar pacientes
    const pacientes = result.rows.filter(user => user.tipo === 'paciente');
    console.log(`\n🏥 Pacientes encontrados: ${pacientes.length}`);
    
    if (pacientes.length > 0) {
      console.log('\n📋 Primeiros 3 pacientes:');
      pacientes.slice(0, 3).forEach(paciente => {
        console.log(`- ${paciente.nome} (${paciente.email}) - Ativo: ${paciente.ativo ? 'Sim' : 'Não'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar usuários:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarUsuarios();