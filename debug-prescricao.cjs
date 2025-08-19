const { Pool } = require('pg');
const { randomUUID } = require('crypto');

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function testarInserçãoPrescrição() {
  try {
    console.log('🔍 Testando diferentes formas de inserir medicamentos...');
    
    // Dados de teste
    const medicamentosArray = [{
      nome: 'Paracetamol 500mg',
      dosagem: '1 comprimido',
      frequencia: 'A cada 8 horas',
      duracao: '7 dias',
      observacoes: 'Tomar após as refeições'
    }];
    
    console.log('\n📋 Objeto original:', medicamentosArray);
    console.log('📋 Tipo:', typeof medicamentosArray);
    console.log('📋 É array:', Array.isArray(medicamentosArray));
    
    // Teste 1: Objeto direto (como está na API atual)
    console.log('\n🧪 Teste 1: Passando objeto direto...');
    try {
      const query1 = `
        INSERT INTO prescricoes (id, consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result1 = await pool.query(query1, [
        randomUUID(), // UUID válido
        'bc243630-d21c-4653-92e4-2f427141f133',
        '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
        medicamentosArray, // Objeto direto
        'Teste 1 - objeto direto',
        'Dr. Teste Debug'
      ]);
      
      console.log('✅ Teste 1 SUCESSO:', result1.rows[0].id);
    } catch (error) {
      console.log('❌ Teste 1 FALHOU:', error.message);
      console.log('   Detalhe:', error.detail);
    }
    
    // Teste 2: JSON.stringify
    console.log('\n🧪 Teste 2: Usando JSON.stringify...');
    try {
      const query2 = `
        INSERT INTO prescricoes (id, consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result2 = await pool.query(query2, [
        randomUUID(), // UUID válido
        'bc243630-d21c-4653-92e4-2f427141f133',
        '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
        JSON.stringify(medicamentosArray), // String JSON
        'Teste 2 - JSON.stringify',
        'Dr. Teste Debug'
      ]);
      
      console.log('✅ Teste 2 SUCESSO:', result2.rows[0].id);
    } catch (error) {
      console.log('❌ Teste 2 FALHOU:', error.message);
      console.log('   Detalhe:', error.detail);
    }
    
    // Teste 3: Com casting ::jsonb
    console.log('\n🧪 Teste 3: JSON.stringify com ::jsonb...');
    try {
      const query3 = `
        INSERT INTO prescricoes (id, consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6)
        RETURNING *
      `;
      
      const result3 = await pool.query(query3, [
        randomUUID(), // UUID válido
        'bc243630-d21c-4653-92e4-2f427141f133',
        '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
        JSON.stringify(medicamentosArray), // String JSON com casting
        'Teste 3 - JSON.stringify com ::jsonb',
        'Dr. Teste Debug'
      ]);
      
      console.log('✅ Teste 3 SUCESSO:', result3.rows[0].id);
    } catch (error) {
      console.log('❌ Teste 3 FALHOU:', error.message);
      console.log('   Detalhe:', error.detail);
    }
    
    // Teste 4: Verificar estrutura da tabela
    console.log('\n🔍 Verificando estrutura da coluna medicamentos...');
    const schemaQuery = `
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' AND column_name = 'medicamentos'
    `;
    
    const schemaResult = await pool.query(schemaQuery);
    console.log('📋 Estrutura da coluna:', schemaResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

testarInserçãoPrescrição();