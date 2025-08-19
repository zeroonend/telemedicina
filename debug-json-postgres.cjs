const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function debugJSON() {
  try {
    console.log('🔍 Debugando problema do JSON no PostgreSQL...');
    
    const medicamentos = [{
      nome: "Paracetamol 500mg",
      dosagem: "1 comprimido",
      frequencia: "A cada 8 horas",
      duracao: "7 dias",
      observacoes: "Tomar após as refeições"
    }];
    
    const medicamentosJson = JSON.stringify(medicamentos);
    console.log('JSON original:', medicamentosJson);
    console.log('Comprimento:', medicamentosJson.length);
    console.log('Tipo:', typeof medicamentosJson);
    
    // Verificar se o JSON é válido
    try {
      JSON.parse(medicamentosJson);
      console.log('✅ JSON é válido');
    } catch (e) {
      console.log('❌ JSON inválido:', e.message);
    }
    
    // Testar diferentes abordagens
    console.log('\n1️⃣ Testando pg_typeof do parâmetro');
    try {
      const result1 = await pool.query(
        'SELECT pg_typeof($1) as tipo, $1 as valor',
        [medicamentosJson]
      );
      console.log('Tipo detectado:', result1.rows[0].tipo);
      console.log('Valor recebido:', result1.rows[0].valor);
    } catch (error) {
      console.log('❌ Erro:', error.message);
    }
    
    console.log('\n2️⃣ Testando conversão explícita para text');
    try {
      const result2 = await pool.query(
        'SELECT $1::text as texto, $1::text::jsonb as jsonb_convertido',
        [medicamentosJson]
      );
      console.log('Texto:', result2.rows[0].texto);
      console.log('JSONB convertido:', result2.rows[0].jsonb_convertido);
    } catch (error) {
      console.log('❌ Erro na conversão:', error.message);
    }
    
    console.log('\n3️⃣ Testando inserção com to_jsonb');
    try {
      const consulta = await pool.query('SELECT id, medico_id FROM consultas LIMIT 1');
      if (consulta.rows.length > 0) {
        const result3 = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, to_jsonb($3::text), $4, $5, true, NOW())
           RETURNING id`,
          [consulta.rows[0].id, consulta.rows[0].medico_id, medicamentosJson, 'Teste to_jsonb', 'Dr. Teste']
        );
        console.log('✅ Sucesso com to_jsonb:', result3.rows[0].id);
      }
    } catch (error) {
      console.log('❌ Erro com to_jsonb:', error.message);
    }
    
    console.log('\n4️⃣ Testando inserção com json_build_array');
    try {
      const consulta = await pool.query('SELECT id, medico_id FROM consultas LIMIT 1');
      if (consulta.rows.length > 0) {
        const result4 = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, json_build_array(json_build_object(
             'nome', $3,
             'dosagem', $4,
             'frequencia', $5,
             'duracao', $6,
             'observacoes', $7
           )), $8, $9, true, NOW())
           RETURNING id`,
          [
            consulta.rows[0].id, 
            consulta.rows[0].medico_id,
            medicamentos[0].nome,
            medicamentos[0].dosagem,
            medicamentos[0].frequencia,
            medicamentos[0].duracao,
            medicamentos[0].observacoes,
            'Teste json_build',
            'Dr. Teste'
          ]
        );
        console.log('✅ Sucesso com json_build_array:', result4.rows[0].id);
      }
    } catch (error) {
      console.log('❌ Erro com json_build_array:', error.message);
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await pool.end();
  }
}

debugJSON();