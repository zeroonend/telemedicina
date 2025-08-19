const { Pool } = require('pg');

// Configuração do banco (mesma da API)
const pool = new Pool({
  user: 'app_telemedicina',
  host: '93.127.210.141',
  database: 'trae_telemedicina',
  password: '12345678',
  port: 5432,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testarInsercaoHistorico() {
  try {
    console.log('🔍 Testando inserção no histórico médico...');
    
    // Dados de teste
    const medicamentosSimples = [
      {
        nome: 'Paracetamol 500mg',
        dosagem: '1 comprimido',
        frequencia: 'A cada 8 horas',
        duracao: '7 dias',
        observacoes: 'Tomar após as refeições'
      }
    ];
    
    console.log('Medicamentos originais:', medicamentosSimples);
    console.log('Tipo dos medicamentos:', typeof medicamentosSimples);
    console.log('É array?', Array.isArray(medicamentosSimples));
    
    // Buscar uma consulta válida
    const consultaResult = await pool.query(
      'SELECT id, paciente_id FROM consultas LIMIT 1'
    );
    
    if (consultaResult.rows.length === 0) {
      console.log('❌ Nenhuma consulta encontrada');
      return;
    }
    
    const consulta = consultaResult.rows[0];
    console.log('Consulta encontrada:', consulta.id, 'Paciente:', consulta.paciente_id);
    
    // Testar inserção direta
    console.log('\n📝 Testando inserção direta...');
    
    try {
      const result = await pool.query(
        `INSERT INTO historico_medico (paciente_id, consulta_id, medicamentos, observacoes, criado_em) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
        [
          consulta.paciente_id,
          consulta.id,
          medicamentosSimples, // Array direto
          'Teste de inserção automática'
        ]
      );
      
      console.log('✅ Inserção bem-sucedida! ID:', result.rows[0].id);
      
      // Verificar o que foi salvo
      const verificacao = await pool.query(
        'SELECT medicamentos FROM historico_medico WHERE id = $1',
        [result.rows[0].id]
      );
      
      console.log('Medicamentos salvos:', verificacao.rows[0].medicamentos);
      console.log('Tipo dos medicamentos salvos:', typeof verificacao.rows[0].medicamentos);
      
      // Limpar o teste
      await pool.query('DELETE FROM historico_medico WHERE id = $1', [result.rows[0].id]);
      console.log('🧹 Registro de teste removido');
      
    } catch (error) {
      console.error('❌ Erro na inserção:', error.message);
      console.error('Detalhes:', error.detail);
      console.error('Código:', error.code);
    }
    
    // Testar com JSON.stringify
    console.log('\n📝 Testando com JSON.stringify...');
    
    try {
      const medicamentosString = JSON.stringify(medicamentosSimples);
      console.log('JSON string:', medicamentosString);
      console.log('Tipo da string:', typeof medicamentosString);
      
      const result = await pool.query(
        `INSERT INTO historico_medico (paciente_id, consulta_id, medicamentos, observacoes, criado_em) 
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING id`,
        [
          consulta.paciente_id,
          consulta.id,
          medicamentosString, // String JSON
          'Teste com JSON.stringify'
        ]
      );
      
      console.log('✅ Inserção com string bem-sucedida! ID:', result.rows[0].id);
      
      // Verificar o que foi salvo
      const verificacao = await pool.query(
        'SELECT medicamentos FROM historico_medico WHERE id = $1',
        [result.rows[0].id]
      );
      
      console.log('Medicamentos salvos (string):', verificacao.rows[0].medicamentos);
      console.log('Tipo dos medicamentos salvos (string):', typeof verificacao.rows[0].medicamentos);
      
      // Limpar o teste
      await pool.query('DELETE FROM historico_medico WHERE id = $1', [result.rows[0].id]);
      console.log('🧹 Registro de teste removido');
      
    } catch (error) {
      console.error('❌ Erro na inserção com string:', error.message);
      console.error('Detalhes:', error.detail);
      console.error('Código:', error.code);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
  }
}

testarInsercaoHistorico();