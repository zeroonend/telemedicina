import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function criarUsuariosTeste() {
  console.log('👤 Criando usuários de teste...');
  
  try {
    // Criar paciente de teste
    const pacienteId = randomUUID();
    const senhaHashPaciente = await bcrypt.hash('123456', 10);
    
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, phone, user_type, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING`,
      [pacienteId, 'paciente@teste.com', senhaHashPaciente, 'Paciente Teste', '11999999999', 'paciente', true]
    );
    console.log('✅ Paciente de teste criado:', pacienteId);
    
    // Criar médico de teste
    const medicoId = randomUUID();
    const senhaHashMedico = await bcrypt.hash('123456', 10);
    
    await pool.query(
      `INSERT INTO users (id, email, password_hash, name, phone, user_type, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       ON CONFLICT (email) DO NOTHING`,
      [medicoId, 'medico@teste.com', senhaHashMedico, 'Dr. Médico Teste', '11888888888', 'medico', true]
    );
    console.log('✅ Médico de teste criado:', medicoId);
    
    // Listar usuários criados
    const usuarios = await pool.query('SELECT id, email, name, user_type FROM users WHERE email LIKE \'%teste.com\'');
    console.log('\n📋 Usuários de teste no banco:');
    usuarios.rows.forEach(user => {
      console.log(`- ${user.name} (${user.user_type}): ${user.email} [ID: ${user.id}]`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error.message);
  } finally {
    await pool.end();
  }
}

criarUsuariosTeste();