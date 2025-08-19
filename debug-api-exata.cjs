const { Pool } = require('pg');
require('dotenv').config();

// Configuração idêntica à API
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testarAPIExata() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testando query exata da API...');
    
    // Dados exatos do log da API
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
    
    console.log('Medicamentos originais:', medicamentosSimples);
    console.log('Tipo dos medicamentos:', typeof medicamentosSimples);
    
    // Criar JSON string exatamente como a API
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('JSON string criada:', medicamentosJson);
    console.log('Tipo da JSON string:', typeof medicamentosJson);
    console.log('Tamanho da JSON string:', medicamentosJson.length);
    
    // Verificar se a string é válida JSON
    try {
      const parsed = JSON.parse(medicamentosJson);
      console.log('✅ JSON é válido');
      console.log('Parsed:', parsed);
    } catch (e) {
      console.log('❌ JSON inválido:', e.message);
      return;
    }
    
    // Usar UUIDs válidos do banco
    const consulta_id = '32610a5e-74bf-45db-97cc-6fdd780b5e44';
    const medico_id = '7e951e2b-4a41-48f3-ba0c-73a07dcd197c';
    const orientacoes = 'Teste de prescrição';
    
    console.log('\n🔍 Parâmetros da query:');
    console.log('consulta_id:', consulta_id, typeof consulta_id);
    console.log('medico_id:', medico_id, typeof medico_id);
    console.log('medicamentosJson:', medicamentosJson, typeof medicamentosJson);
    console.log('orientacoes:', orientacoes, typeof orientacoes);
    
    await client.query('BEGIN');
    
    // Query EXATA da API (linha 135-139)
    const query = `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING *`;
    
    const params = [consulta_id, medico_id, medicamentosJson, orientacoes || '', `Dr. ${medico_id}`];
    
    console.log('\n🔍 Query SQL:');
    console.log(query);
    console.log('\n🔍 Parâmetros:');
    params.forEach((param, index) => {
      console.log(`$${index + 1}:`, param, `(${typeof param})`);
    });
    
    console.log('\n🚀 Executando query...');
    
    const result = await client.query(query, params);
    
    console.log('✅ Prescrição inserida com sucesso!');
    console.log('ID da prescrição:', result.rows[0].id);
    
    // Verificar os dados inseridos
    const verificacao = await client.query(
      'SELECT id, medicamentos FROM prescricoes WHERE id = $1',
      [result.rows[0].id]
    );
    
    console.log('\n🔍 Dados inseridos:');
    console.log('Medicamentos salvos:', verificacao.rows[0].medicamentos);
    console.log('Tipo dos medicamentos salvos:', typeof verificacao.rows[0].medicamentos);
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    console.error('Código do erro:', error.code);
    console.error('Detalhes:', error.detail);
    console.error('Stack completo:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testarAPIExata().catch(console.error);