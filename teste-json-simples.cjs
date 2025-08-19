const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
});

async function testeJsonSimples() {
  try {
    console.log('🧪 TESTE JSON SIMPLES');
    console.log('====================');
    
    // Dados de teste simples
    const medicamentosSimples = [
      {
        nome: "Paracetamol",
        dosagem: "500mg",
        frequencia: "8/8h",
        duracao: "7 dias",
        observacoes: "Tomar após as refeições"
      }
    ];
    
    console.log('1. Objeto original:');
    console.log(JSON.stringify(medicamentosSimples, null, 2));
    
    // Converter para JSON string
    const jsonString = JSON.stringify(medicamentosSimples);
    console.log('\n2. JSON string:');
    console.log(jsonString);
    
    // Testar inserção direta no PostgreSQL
    console.log('\n3. Testando inserção no PostgreSQL...');
    
    const result = await pool.query(
      'SELECT $1::jsonb as teste_json',
      [jsonString]
    );
    
    console.log('✅ Sucesso! Resultado:');
    console.log(result.rows[0].teste_json);
    
    // Testar inserção na tabela real (sem commit)
    console.log('\n4. Testando inserção na tabela prescricoes...');
    
    await pool.query('BEGIN');
    
    const insertResult = await pool.query(
      `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
       VALUES ($1, $2, $3, $4, $5, true, NOW())
       RETURNING id, medicamentos`,
      [
        '32610a5e-74bf-45db-97cc-6fdd780b5e44', // consulta_id válido
        '7e951e2b-4a41-48f3-ba0c-73a07dcd197c', // medico_id do Dr. Médico Teste
        jsonString,
        'Teste de inserção',
        'Dr. Teste'
      ]
    );
    
    console.log('✅ Inserção bem-sucedida!');
    console.log('ID:', insertResult.rows[0].id);
    console.log('Medicamentos:', insertResult.rows[0].medicamentos);
    
    await pool.query('ROLLBACK'); // Não salvar o teste
    console.log('✅ Rollback executado (teste não salvo)');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error.detail || 'Nenhum detalhe adicional');
  } finally {
    await pool.end();
  }
}

testeJsonSimples();