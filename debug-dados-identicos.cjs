const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  user: 'postgres',
  host: '138.197.105.123',
  database: 'telemedicina',
  password: 'postgres123',
  port: 5432,
});

async function testarDadosIdenticos() {
  console.log('🔍 TESTANDO DADOS IDÊNTICOS AO HTTP');
  console.log('==================================');
  
  try {
    // Dados EXATAMENTE como enviados na requisição HTTP
    const medicamentosOriginais = [
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
    
    console.log('1. Medicamentos originais (como chegam na API):');
    console.log(JSON.stringify(medicamentosOriginais, null, 2));
    
    // Processamento EXATO da API
    const medicamentosSimples = medicamentosOriginais.map(med => ({
      nome: String(med.nome),
      dosagem: String(med.dosagem),
      frequencia: String(med.frequencia),
      duracao: String(med.duracao),
      observacoes: String(med.observacoes || '')
    }));
    
    console.log('\n2. Medicamentos processados (após String()):');
    console.log(JSON.stringify(medicamentosSimples, null, 2));
    
    // JSON string EXATA que vai para o PostgreSQL
    const jsonString = JSON.stringify(medicamentosSimples);
    console.log('\n3. JSON string para PostgreSQL:');
    console.log(jsonString);
    console.log('Tamanho:', jsonString.length, 'caracteres');
    
    // Verificar se o JSON é válido
    try {
      const parsed = JSON.parse(jsonString);
      console.log('\n4. ✅ JSON é válido');
      console.log('Parsed back:', parsed);
    } catch (parseError) {
      console.log('\n4. ❌ JSON inválido:', parseError.message);
      return;
    }
    
    // Testar inserção no PostgreSQL
    console.log('\n5. Testando inserção no PostgreSQL...');
    
    await pool.query('BEGIN');
    
    try {
      const result = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING id, medicamentos`,
        [
          '32610a5e-74bf-45db-97cc-6fdd780b5e44', // consulta_id do teste
          '7e951e2b-4a41-48f3-ba0c-73a07dcd197c', // medico_id correto
          jsonString, // JSON string exata
          'Teste de inserção',
          'Dr. Teste'
        ]
      );
      
      console.log('✅ Inserção bem-sucedida!');
      console.log('ID:', result.rows[0].id);
      console.log('Medicamentos salvos:', result.rows[0].medicamentos);
      
      // Rollback para não afetar os dados
      await pool.query('ROLLBACK');
      console.log('✅ Rollback executado');
      
    } catch (insertError) {
      await pool.query('ROLLBACK');
      console.log('❌ Erro na inserção:', insertError.message);
      console.log('Detalhes:', insertError.detail || 'Sem detalhes');
      console.log('Hint:', insertError.hint || 'Sem hint');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
  }
}

testarDadosIdenticos();