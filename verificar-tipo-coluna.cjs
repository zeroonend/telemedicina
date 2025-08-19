const { Pool } = require('pg');

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function verificarTipoColuna() {
  try {
    console.log('🔍 Verificando tipo da coluna medicamentos...');
    
    // Verificar tipo da coluna medicamentos
    const tipoColuna = await pool.query(`
      SELECT column_name, data_type, udt_name 
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' 
      AND column_name = 'medicamentos'
    `);
    
    console.log('📋 Tipo da coluna medicamentos:', tipoColuna.rows[0]);
    
    // Testar inserção com JSONB explícito
    console.log('\n🧪 Testando inserção com JSONB explícito...');
    const testData = JSON.stringify([{
      nome: 'Teste Medicamento',
      dosagem: '1 comprimido',
      frequencia: 'A cada 8 horas',
      duracao: '7 dias',
      observacoes: 'Teste'
    }]);
    
    console.log('Dados para teste:', testData);
    
    // Teste com JSONB casting
    const resultado = await pool.query(`
      INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
      VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())
      RETURNING id, medicamentos
    `, [
      crypto.randomUUID(),
      crypto.randomUUID(), 
      testData,
      'Teste de tipo de coluna',
      'Dr. Teste Tipo'
    ]);
    
    console.log('✅ SUCESSO com ::jsonb! ID:', resultado.rows[0].id);
    console.log('📋 Medicamentos salvos:', resultado.rows[0].medicamentos);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error('Detalhes:', error.detail);
  } finally {
    await pool.end();
  }
}

verificarTipoColuna();