const { Pool } = require('pg');

// Configuração do banco de dados (mesma do .env)
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
});

async function testarJSONBDireto() {
  console.log('🔍 TESTANDO JSONB DIRETO');
  console.log('========================');
  
  try {
    // Dados exatamente como na API
    const medicamentosSimples = [
      {
        nome: 'Paracetamol',
        dosagem: '500mg',
        frequencia: '8/8h',
        duracao: '7 dias',
        observacoes: 'Tomar após as refeições'
      },
      {
        nome: 'Ibuprofeno',
        dosagem: '400mg',
        frequencia: '12/12h',
        duracao: '5 dias',
        observacoes: 'Em caso de dor'
      }
    ];
    
    console.log('1. Medicamentos originais:');
    console.log(JSON.stringify(medicamentosSimples, null, 2));
    
    // Testar diferentes abordagens
    const jsonString = JSON.stringify(medicamentosSimples);
    console.log('\n2. JSON string:', jsonString);
    
    await pool.query('BEGIN');
    
    try {
      // Abordagem 1: String JSON direta
      console.log('\n3. Testando inserção com string JSON...');
      const result1 = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING id, medicamentos`,
        [
          '32610a5e-74bf-45db-97cc-6fdd780b5e44',
          '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
          jsonString,
          'Teste direto',
          'Dr. Teste'
        ]
      );
      
      console.log('✅ Abordagem 1 funcionou!');
      console.log('ID:', result1.rows[0].id);
      console.log('Medicamentos salvos:', result1.rows[0].medicamentos);
      
      await pool.query('ROLLBACK');
      
    } catch (error1) {
      await pool.query('ROLLBACK');
      console.log('❌ Abordagem 1 falhou:', error1.message);
      console.log('Detalhes:', error1.detail);
      
      // Abordagem 2: Cast explícito para JSONB
      try {
        await pool.query('BEGIN');
        console.log('\n4. Testando com cast explícito para JSONB...');
        
        const result2 = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())
           RETURNING id, medicamentos`,
          [
            '32610a5e-74bf-45db-97cc-6fdd780b5e44',
            '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
            jsonString,
            'Teste com cast',
            'Dr. Teste'
          ]
        );
        
        console.log('✅ Abordagem 2 funcionou!');
        console.log('ID:', result2.rows[0].id);
        console.log('Medicamentos salvos:', result2.rows[0].medicamentos);
        
        await pool.query('ROLLBACK');
        
      } catch (error2) {
        await pool.query('ROLLBACK');
        console.log('❌ Abordagem 2 falhou:', error2.message);
        console.log('Detalhes:', error2.detail);
        
        // Abordagem 3: Objeto JavaScript direto
        try {
          await pool.query('BEGIN');
          console.log('\n5. Testando com objeto JavaScript direto...');
          
          const result3 = await pool.query(
            `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
             VALUES ($1, $2, $3, $4, $5, true, NOW())
             RETURNING id, medicamentos`,
            [
              '32610a5e-74bf-45db-97cc-6fdd780b5e44',
              '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
              medicamentosSimples, // Objeto direto
              'Teste objeto direto',
              'Dr. Teste'
            ]
          );
          
          console.log('✅ Abordagem 3 funcionou!');
          console.log('ID:', result3.rows[0].id);
          console.log('Medicamentos salvos:', result3.rows[0].medicamentos);
          
          await pool.query('ROLLBACK');
          
        } catch (error3) {
          await pool.query('ROLLBACK');
          console.log('❌ Abordagem 3 falhou:', error3.message);
          console.log('Detalhes:', error3.detail);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

testarJSONBDireto();