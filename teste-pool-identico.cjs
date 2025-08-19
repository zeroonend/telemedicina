const { Pool } = require('pg');
require('dotenv').config();

// Configuração IDÊNTICA à API
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'telemedicina',
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testarPoolIdentico() {
  console.log('🔍 TESTANDO COM POOL IDÊNTICO À API');
  console.log('===================================');
  
  console.log('Configuração do pool:');
  console.log('- DB_HOST:', process.env.DB_HOST);
  console.log('- DB_NAME:', process.env.DB_NAME);
  console.log('- DB_USER:', process.env.DB_USER);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SSL:', process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false);
  
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
    
    console.log('\n1. Medicamentos originais:');
    console.log(JSON.stringify(medicamentosSimples, null, 2));
    
    // Processar exatamente como na API
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('\n2. JSON string criada:', medicamentosJson);
    console.log('Tipo da JSON string:', typeof medicamentosJson);
    console.log('Tamanho da JSON string:', medicamentosJson.length);
    
    // Iniciar transação como na API
    await pool.query('BEGIN');
    
    try {
      console.log('\n3. Executando query IDÊNTICA à API...');
      
      const prescricaoResult = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING *`,
        [
          '32610a5e-74bf-45db-97cc-6fdd780b5e44',
          '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
          medicamentosJson,
          'Teste com pool idêntico',
          'Dr. 7e951e2b-4a41-48f3-ba0c-73a07dcd197c'
        ]
      );
      
      console.log('✅ Inserção bem-sucedida!');
      console.log('ID:', prescricaoResult.rows[0].id);
      console.log('Medicamentos salvos:', prescricaoResult.rows[0].medicamentos);
      
      await pool.query('ROLLBACK');
      console.log('✅ Rollback executado');
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.log('❌ Erro na inserção:', error.message);
      console.log('Código do erro:', error.code);
      console.log('Detalhes:', error.detail);
      console.log('Where:', error.where);
      
      // Tentar sem transação
      console.log('\n4. Tentando sem transação...');
      try {
        const resultSemTransacao = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING *`,
          [
            '32610a5e-74bf-45db-97cc-6fdd780b5e44',
            '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
            medicamentosJson,
            'Teste sem transação',
            'Dr. 7e951e2b-4a41-48f3-ba0c-73a07dcd197c'
          ]
        );
        
        console.log('✅ Inserção sem transação funcionou!');
        console.log('ID:', resultSemTransacao.rows[0].id);
        
        // Deletar o registro criado
        await pool.query('DELETE FROM prescricoes WHERE id = $1', [resultSemTransacao.rows[0].id]);
        console.log('✅ Registro deletado');
        
      } catch (error2) {
        console.log('❌ Erro sem transação também:', error2.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

testarPoolIdentico();