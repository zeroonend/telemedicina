const { Pool } = require('pg');

// Configuração do banco
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function debugColuna() {
  try {
    console.log('🔍 Verificando estrutura da coluna medicamentos...');
    
    // Verificar estrutura da tabela
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' AND column_name = 'medicamentos'
    `);
    
    console.log('Estrutura da coluna:', estrutura.rows[0]);
    
    // Verificar se há dados existentes
    const dadosExistentes = await pool.query(`
      SELECT id, medicamentos, pg_typeof(medicamentos) as tipo
      FROM prescricoes 
      LIMIT 3
    `);
    
    console.log('\nDados existentes:');
    dadosExistentes.rows.forEach((row, index) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Tipo: ${row.tipo}`);
      console.log(`   Valor: ${JSON.stringify(row.medicamentos)}`);
    });
    
    // Testar inserção com diferentes abordagens
    const consulta = await pool.query('SELECT id, medico_id FROM consultas LIMIT 1');
    if (consulta.rows.length > 0) {
      const consultaId = consulta.rows[0].id;
      const medicoId = consulta.rows[0].medico_id;
      
      console.log('\n🧪 Testando diferentes abordagens de inserção...');
      
      // Abordagem 1: jsonb_build_array com valores individuais
      try {
        console.log('\n1️⃣ Testando jsonb_build_array...');
        const result1 = await pool.query(`
          INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
          VALUES ($1, $2, jsonb_build_array(
            jsonb_build_object(
              'nome', $3,
              'dosagem', $4,
              'frequencia', $5,
              'duracao', $6,
              'observacoes', $7
            )
          ), $8, $9, true, NOW())
          RETURNING id, medicamentos
        `, [
          consultaId, medicoId,
          'Paracetamol 500mg',
          '1 comprimido',
          'A cada 8 horas',
          '7 dias',
          'Tomar após as refeições',
          'Teste jsonb_build_array',
          'Dr. Teste'
        ]);
        console.log('✅ Sucesso com jsonb_build_array:', result1.rows[0].id);
        console.log('   Medicamentos inseridos:', result1.rows[0].medicamentos);
      } catch (error) {
        console.log('❌ Erro com jsonb_build_array:', error.message);
      }
      
      // Abordagem 2: Cast direto para jsonb
      try {
        console.log('\n2️⃣ Testando cast direto...');
        const medicamentosString = '[{"nome":"Ibuprofeno 600mg","dosagem":"1 comprimido","frequencia":"A cada 12 horas","duracao":"5 dias","observacoes":"Tomar com alimentos"}]';
        const result2 = await pool.query(`
          INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
          VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())
          RETURNING id, medicamentos
        `, [
          consultaId, medicoId,
          medicamentosString,
          'Teste cast direto',
          'Dr. Teste'
        ]);
        console.log('✅ Sucesso com cast direto:', result2.rows[0].id);
        console.log('   Medicamentos inseridos:', result2.rows[0].medicamentos);
      } catch (error) {
        console.log('❌ Erro com cast direto:', error.message);
      }
      
      // Abordagem 3: Usando função json_array
      try {
        console.log('\n3️⃣ Testando json_array...');
        const result3 = await pool.query(`
          INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
          VALUES ($1, $2, json_array(json_object(
            'nome', $3,
            'dosagem', $4,
            'frequencia', $5,
            'duracao', $6,
            'observacoes', $7
          )), $8, $9, true, NOW())
          RETURNING id, medicamentos
        `, [
          consultaId, medicoId,
          'Dipirona 500mg',
          '1 comprimido',
          'A cada 6 horas',
          '3 dias',
          'Se necessário para dor',
          'Teste json_array',
          'Dr. Teste'
        ]);
        console.log('✅ Sucesso com json_array:', result3.rows[0].id);
        console.log('   Medicamentos inseridos:', result3.rows[0].medicamentos);
      } catch (error) {
        console.log('❌ Erro com json_array:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  } finally {
    await pool.end();
  }
}

debugColuna();