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

async function testarPrescricao() {
  try {
    console.log('🧪 Testando criação de prescrição como na API...');
    
    // Dados exatos do teste
    const medicamentosArray = [{
      nome: 'Paracetamol 500mg',
      dosagem: '1 comprimido',
      frequencia: 'A cada 8 horas',
      duracao: '7 dias',
      observacoes: 'Tomar após as refeições'
    }];
    
    console.log('📋 Array original:', medicamentosArray);
    
    // Simular exatamente o que a API faz
    const medicamentosJson = JSON.stringify(medicamentosArray);
    console.log('📋 JSON.stringify resultado:', medicamentosJson);
    console.log('📋 Tipo:', typeof medicamentosJson);
    
    // Testar inserção
    const query = `
      INSERT INTO prescricoes (id, consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, true, NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [
      randomUUID(),
      'bc243630-d21c-4653-92e4-2f427141f133',
      '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',
      medicamentosJson,
      'Prescrição de teste automatizado',
      'Dr. Teste API'
    ]);
    
    console.log('✅ SUCESSO! Prescrição criada:', result.rows[0].id);
    console.log('📋 Medicamentos salvos:', result.rows[0].medicamentos);
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('📋 Detalhes:', error.detail);
  } finally {
    await pool.end();
  }
}

testarPrescricao();