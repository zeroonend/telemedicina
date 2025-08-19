const { Pool } = require('pg');

// Configuração exata do pool da API
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

async function debugTransacao() {
  try {
    console.log('🔍 DEBUG - TESTE COM TRANSAÇÃO (CONTEXTO EXATO DA API)');
    console.log('====================================================');
    
    // Buscar consulta válida
    const consultaResult = await pool.query(`
      SELECT c.id, c.medico_id, c.paciente_id, c.status, p.name as paciente_nome
      FROM consultas c
      JOIN users p ON c.paciente_id = p.id
      LEFT JOIN prescricoes pr ON c.id = pr.consulta_id
      WHERE pr.id IS NULL
        AND c.status IN ('em_andamento', 'finalizada')
      LIMIT 1;
    `);
    
    if (consultaResult.rows.length === 0) {
      console.log('❌ Nenhuma consulta disponível');
      return;
    }
    
    const consulta = consultaResult.rows[0];
    console.log('✅ Consulta encontrada:', consulta.id);
    console.log('   Médico:', consulta.medico_id);
    console.log('   Paciente:', consulta.paciente_id);
    console.log('   Status:', consulta.status);
    
    // Dados exatos que a API está tentando inserir
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
    
    console.log('\n📋 Medicamentos a inserir:', JSON.stringify(medicamentosSimples, null, 2));
    
    // Serialização exata da API
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('\n🔧 JSON string:', medicamentosJson);
    console.log('   Tipo:', typeof medicamentosJson);
    console.log('   Tamanho:', medicamentosJson.length);
    
    // INICIAR TRANSAÇÃO (CONTEXTO EXATO DA API)
    console.log('\n🔄 Iniciando transação...');
    await pool.query('BEGIN');
    
    try {
      console.log('\n💾 Inserindo prescrição dentro da transação...');
      
      // Query EXATA da API (linha 133)
      const prescricaoResult = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING *`,
        [
          consulta.id,
          consulta.medico_id,
          medicamentosJson,
          'Manter repouso e hidratação adequada',
          `Dr. ${consulta.medico_id}`
        ]
      );
      
      const novaPrescricao = prescricaoResult.rows[0];
      console.log('\n✅ SUCESSO! Prescrição inserida:');
      console.log('   ID:', novaPrescricao.id);
      console.log('   Medicamentos salvos:', JSON.stringify(novaPrescricao.medicamentos, null, 2));
      
      // Atualizar status da consulta (como na API)
      if (consulta.status !== 'finalizada') {
        console.log('\n🔄 Atualizando status da consulta...');
        await pool.query(
          'UPDATE consultas SET status = $1 WHERE id = $2',
          ['finalizada', consulta.id]
        );
        console.log('✅ Status atualizado para finalizada');
      }
      
      // Integração com histórico médico (como na API)
      console.log('\n📋 Integrando com histórico médico...');
      const medicamentosTexto = medicamentosSimples.map(med => 
        `${med.nome} - ${med.dosagem} - ${med.frequencia} - ${med.duracao}${med.observacoes ? ` (${med.observacoes})` : ''}`
      ).join('; ');
      
      // Verificar histórico existente
      const historicoExistente = await pool.query(
        'SELECT id, medicamentos FROM historico_medico WHERE consulta_id = $1',
        [consulta.id]
      );
      
      if (historicoExistente.rows.length > 0) {
        console.log('📝 Atualizando histórico existente...');
        const historicoId = historicoExistente.rows[0].id;
        const medicamentosAtuais = historicoExistente.rows[0].medicamentos || '';
        const medicamentosAtualizados = medicamentosAtuais ? 
          `${medicamentosAtuais}; ${medicamentosTexto}` : medicamentosTexto;
        
        await pool.query(
          'UPDATE historico_medico SET medicamentos = $1 WHERE id = $2',
          [medicamentosAtualizados, historicoId]
        );
        console.log('✅ Histórico atualizado');
      } else {
        console.log('📝 Criando novo registro no histórico...');
        await pool.query(
          `INSERT INTO historico_medico (paciente_id, consulta_id, medicamentos, observacoes, criado_em) 
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            consulta.paciente_id,
            consulta.id,
            medicamentosTexto,
            'Prescrição médica criada automaticamente'
          ]
        );
        console.log('✅ Histórico criado');
      }
      
      // COMMIT da transação
      console.log('\n✅ Fazendo COMMIT da transação...');
      await pool.query('COMMIT');
      console.log('✅ Transação confirmada com sucesso!');
      
    } catch (error) {
      console.log('\n❌ ERRO dentro da transação:');
      console.log('   Mensagem:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.detail);
      console.log('   Posição:', error.position);
      console.log('   Where:', error.where);
      
      console.log('\n🔄 Fazendo ROLLBACK...');
      await pool.query('ROLLBACK');
      console.log('✅ Rollback executado');
      
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

debugTransacao();