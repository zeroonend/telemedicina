const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
});

async function testarJsonVsJsonb() {
  try {
    console.log('🔍 TESTANDO DIFERENÇAS ENTRE JSON E JSONB');
    
    const medicamentosArray = [{
      nome: "Paracetamol 500mg",
      dosagem: "1 comprimido", 
      frequencia: "A cada 8 horas",
      duracao: "7 dias",
      observacoes: "Tomar após as refeições"
    }];
    
    const medicamentosJson = JSON.stringify(medicamentosArray);
    console.log('JSON String:', medicamentosJson);
    console.log('Tipo:', typeof medicamentosJson);
    
    // Teste 1: Verificar tipo da coluna medicamentos
    console.log('\n📋 1. VERIFICANDO TIPO DA COLUNA');
    const tipoColuna = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' AND column_name = 'medicamentos'
    `);
    console.log('Tipo da coluna medicamentos:', tipoColuna.rows[0]);
    
    // Teste 2: Tentar inserção com diferentes abordagens
    console.log('\n🧪 2. TESTANDO DIFERENTES ABORDAGENS DE INSERÇÃO');
    
    const consulta_id = 'f2e2bb85-1cab-436e-99ff-2d7dfa7aeeb4';
    const medico_id = '7e951e2b-4a41-48f3-ba0c-73a07dcd197c';
    
    // Abordagem 1: Cast direto para jsonb
    try {
      console.log('\n🔸 Teste A: $1::jsonb');
      await pool.query(
        'INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em) VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())',
        [consulta_id, medico_id, medicamentosJson, 'Teste A', 'Dr. Teste']
      );
      console.log('✅ Sucesso com $3::jsonb');
    } catch (error) {
      console.log('❌ Falhou com $3::jsonb:', error.message);
    }
    
    // Abordagem 2: Usando JSON.parse no parâmetro
    try {
      console.log('\n🔸 Teste B: JSON.parse()');
      await pool.query(
        'INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em) VALUES ($1, $2, $3, $4, $5, true, NOW())',
        [consulta_id, medico_id, JSON.parse(medicamentosJson), 'Teste B', 'Dr. Teste']
      );
      console.log('✅ Sucesso com JSON.parse()');
    } catch (error) {
      console.log('❌ Falhou com JSON.parse():', error.message);
    }
    
    // Abordagem 3: Usando array direto
    try {
      console.log('\n🔸 Teste C: Array direto');
      await pool.query(
        'INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em) VALUES ($1, $2, $3, $4, $5, true, NOW())',
        [consulta_id, medico_id, medicamentosArray, 'Teste C', 'Dr. Teste']
      );
      console.log('✅ Sucesso com array direto');
    } catch (error) {
      console.log('❌ Falhou com array direto:', error.message);
    }
    
    // Abordagem 4: Usando to_json
    try {
      console.log('\n🔸 Teste D: to_json($3::text)');
      await pool.query(
        'INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em) VALUES ($1, $2, to_json($3::text), $4, $5, true, NOW())',
        [consulta_id, medico_id, medicamentosJson, 'Teste D', 'Dr. Teste']
      );
      console.log('✅ Sucesso com to_json($3::text)');
    } catch (error) {
      console.log('❌ Falhou com to_json($3::text):', error.message);
    }
    
    // Abordagem 5: Usando aspas simples na query
    try {
      console.log('\n🔸 Teste E: String literal na query');
      await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em) VALUES ($1, $2, '${medicamentosJson}'::jsonb, $3, $4, true, NOW())`,
        [consulta_id, medico_id, 'Teste E', 'Dr. Teste']
      );
      console.log('✅ Sucesso com string literal');
    } catch (error) {
      console.log('❌ Falhou com string literal:', error.message);
    }
    
    console.log('\n🎯 TESTE CONCLUÍDO');
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await pool.end();
  }
}

testarJsonVsJsonb();