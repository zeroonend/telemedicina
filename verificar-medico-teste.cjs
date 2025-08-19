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

async function verificarMedicoTeste() {
  try {
    console.log('🔍 Verificando médico teste no banco de dados...');
    
    // Buscar o médico teste
    const queryMedico = `
      SELECT id, nome, email, tipo, especialidade, is_active, created_at
      FROM usuarios 
      WHERE email = 'medico@teste.com'
    `;
    
    const result = await pool.query(queryMedico);
    
    if (result.rows.length === 0) {
      console.log('❌ Médico teste não encontrado no banco de dados!');
      console.log('📝 Criando médico teste...');
      
      // Criar o médico teste
      const insertQuery = `
        INSERT INTO usuarios (id, nome, email, senha, tipo, especialidade, is_active, created_at, updated_at)
        VALUES (
          gen_random_uuid(),
          'Dr. João Silva',
          'medico@teste.com',
          '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          'medico',
          'Cardiologia',
          true,
          NOW(),
          NOW()
        )
        RETURNING id, nome, email, tipo, especialidade, is_active
      `;
      
      const insertResult = await pool.query(insertQuery);
      console.log('✅ Médico teste criado com sucesso!');
      console.log('Dados do médico:', insertResult.rows[0]);
      
    } else {
      const medico = result.rows[0];
      console.log('✅ Médico teste encontrado!');
      console.log('Dados do médico:', medico);
      
      if (!medico.is_active) {
        console.log('⚠️ Médico está inativo. Ativando...');
        
        const updateQuery = `
          UPDATE usuarios 
          SET is_active = true, updated_at = NOW()
          WHERE email = 'medico@teste.com'
          RETURNING id, nome, email, tipo, especialidade, is_active
        `;
        
        const updateResult = await pool.query(updateQuery);
        console.log('✅ Médico ativado com sucesso!');
        console.log('Dados atualizados:', updateResult.rows[0]);
      } else {
        console.log('✅ Médico já está ativo!');
      }
    }
    
    // Verificar todos os médicos ativos
    console.log('\n🔍 Listando todos os médicos ativos...');
    const queryMedicosAtivos = `
      SELECT id, nome, email, especialidade, is_active
      FROM usuarios 
      WHERE tipo = 'medico' AND is_active = true
      ORDER BY nome
    `;
    
    const medicosAtivos = await pool.query(queryMedicosAtivos);
    console.log(`📋 Total de médicos ativos: ${medicosAtivos.rows.length}`);
    medicosAtivos.rows.forEach((medico, index) => {
      console.log(`${index + 1}. ${medico.nome} (${medico.especialidade}) - ${medico.email}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar médico teste:', error.message);
    console.error('Detalhes:', error.detail || error.hint || 'Nenhum detalhe adicional');
  } finally {
    await pool.end();
  }
}

verificarMedicoTeste();