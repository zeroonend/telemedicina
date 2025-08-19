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

async function testarQueryMedicos() {
  try {
    console.log('🔍 Testando query da API para listar médicos...');
    
    // Query original da API (com problema)
    console.log('\n❌ Testando query original da API (com erro):');
    try {
      const queryOriginal = `
        SELECT 
          id, nome, email, telefone, user_type as tipo, especialidade, crm,
          is_active as ativo, created_at as criado_em
        FROM usuarios 
        WHERE is_active = true AND user_type = 'medico'
      `;
      const resultOriginal = await pool.query(queryOriginal);
      console.log('✅ Query original funcionou:', resultOriginal.rows.length, 'médicos encontrados');
    } catch (error) {
      console.log('❌ Erro na query original:', error.message);
    }
    
    // Query corrigida
    console.log('\n✅ Testando query corrigida:');
    const queryCorrigida = `
      SELECT 
        id, nome, email, telefone, tipo, especialidade, crm,
        ativo, criado_em
      FROM usuarios 
      WHERE ativo = true AND tipo = 'medico'
    `;
    
    const resultCorrigida = await pool.query(queryCorrigida);
    console.log(`📋 Médicos ativos encontrados: ${resultCorrigida.rows.length}`);
    
    resultCorrigida.rows.forEach((medico, index) => {
      console.log(`${index + 1}. ${medico.nome} (${medico.email})`);
      console.log(`   - Especialidade: ${medico.especialidade || 'Não informada'}`);
      console.log(`   - CRM: ${medico.crm || 'Não informado'}`);
      console.log(`   - Ativo: ${medico.ativo}`);
      console.log('');
    });
    
    // Verificar especificamente o médico teste
    console.log('🔍 Verificando médico teste especificamente...');
    const queryMedicoTeste = `
      SELECT id, nome, email, tipo, especialidade, ativo
      FROM usuarios 
      WHERE email = 'medico@teste.com'
    `;
    
    const medicoTeste = await pool.query(queryMedicoTeste);
    if (medicoTeste.rows.length > 0) {
      const medico = medicoTeste.rows[0];
      console.log('✅ Médico teste encontrado:');
      console.log(`   - Nome: ${medico.nome}`);
      console.log(`   - Email: ${medico.email}`);
      console.log(`   - Tipo: ${medico.tipo}`);
      console.log(`   - Especialidade: ${medico.especialidade || 'Não informada'}`);
      console.log(`   - Ativo: ${medico.ativo}`);
      
      if (!medico.ativo) {
        console.log('⚠️ PROBLEMA: Médico está inativo!');
      } else if (medico.tipo !== 'medico') {
        console.log('⚠️ PROBLEMA: Tipo do usuário não é "medico"!');
      } else {
        console.log('✅ Médico teste está ativo e configurado corretamente!');
      }
    } else {
      console.log('❌ Médico teste não encontrado!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testarQueryMedicos();