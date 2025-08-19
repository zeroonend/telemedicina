const { Pool } = require('pg');
const crypto = require('crypto');

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function debugDadosTeste() {
  try {
    console.log('🔍 Simulando exatamente os dados do teste...');
    
    // Dados EXATOS do teste
    const novaPrescricao = {
      consulta_id: 'd5ee7d2e-a041-4500-99b5-1c5459be629e', // ID real da consulta criada
      medico_id: '7e951e2b-4a41-48f3-ba0c-73a07dcd197c',   // ID real do médico
      medicamentos: [
        {
          nome: 'Paracetamol 500mg',
          dosagem: '1 comprimido',
          frequencia: 'A cada 8 horas',
          duracao: '7 dias',
          observacoes: 'Tomar após as refeições'
        }
      ],
      orientacoes: 'Repouso e hidratação adequada'
    };
    
    console.log('📋 Dados originais do teste:', JSON.stringify(novaPrescricao, null, 2));
    
    // Simular processamento da API
    const medicamentosArray = novaPrescricao.medicamentos;
    console.log('📋 Array de medicamentos:', medicamentosArray);
    console.log('📋 Tipo do array:', typeof medicamentosArray);
    console.log('📋 É array?', Array.isArray(medicamentosArray));
    
    // Processar como a API faz
    const medicamentosSimples = Array.isArray(medicamentosArray) ? medicamentosArray : JSON.parse(medicamentosArray);
    console.log('📋 Medicamentos processados:', medicamentosSimples);
    
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('📋 JSON final:', medicamentosJson);
    console.log('📋 Tipo do JSON:', typeof medicamentosJson);
    
    // Testar inserção com dados reais
    console.log('\n🧪 Testando inserção com dados reais...');
    
    const resultado = await pool.query(`
      INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
      VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())
      RETURNING id, medicamentos
    `, [
      novaPrescricao.consulta_id,
      novaPrescricao.medico_id,
      medicamentosJson,
      novaPrescricao.orientacoes,
      `Dr. ${novaPrescricao.medico_id}`
    ]);
    
    console.log('✅ SUCESSO! ID:', resultado.rows[0].id);
    console.log('📋 Medicamentos salvos:', resultado.rows[0].medicamentos);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('📋 Detalhes:', error.detail);
    console.error('📋 Código:', error.code);
    console.error('📋 Where:', error.where);
  } finally {
    await pool.end();
  }
}

debugDadosTeste();