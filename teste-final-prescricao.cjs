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

async function testarPrescricaoFinal() {
  try {
    console.log('🔍 TESTE FINAL - PRESCRIÇÃO COM UUID VÁLIDO');
    console.log('==========================================');
    
    // Buscar uma consulta válida que não tenha prescrição ainda
    const consultaDisponivel = await pool.query(`
      SELECT c.id, c.medico_id, c.paciente_id, c.status
      FROM consultas c
      LEFT JOIN prescricoes p ON c.id = p.consulta_id
      WHERE p.id IS NULL
        AND c.status IN ('em_andamento', 'finalizada')
      LIMIT 1;
    `);
    
    if (consultaDisponivel.rows.length === 0) {
      console.log('❌ Nenhuma consulta disponível para teste');
      return;
    }
    
    const consulta = consultaDisponivel.rows[0];
    console.log('✅ Consulta encontrada:', consulta.id);
    console.log('   Médico:', consulta.medico_id);
    console.log('   Status:', consulta.status);
    
    // Dados exatos da API que estão falhando
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
    
    console.log('\n📋 Medicamentos a inserir:', medicamentosSimples);
    
    // Criar JSON string exatamente como a API
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('\n🔧 JSON string criada:', medicamentosJson);
    console.log('   Tipo:', typeof medicamentosJson);
    console.log('   Tamanho:', medicamentosJson.length);
    
    // Iniciar transação
    await pool.query('BEGIN');
    
    try {
      console.log('\n💾 Inserindo prescrição...');
      
      // Query exata da API
      const result = await pool.query(
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
      
      const novaPrescricao = result.rows[0];
      console.log('\n✅ SUCESSO! Prescrição criada:');
      console.log('   ID:', novaPrescricao.id);
      console.log('   Consulta ID:', novaPrescricao.consulta_id);
      console.log('   Medicamentos salvos:', JSON.stringify(novaPrescricao.medicamentos, null, 2));
      console.log('   Orientações:', novaPrescricao.orientacoes);
      console.log('   Criado em:', novaPrescricao.criado_em);
      
      // Verificar se os dados foram salvos corretamente
      const verificacao = await pool.query(
        'SELECT medicamentos FROM prescricoes WHERE id = $1',
        [novaPrescricao.id]
      );
      
      console.log('\n🔍 Verificação dos dados salvos:');
      console.log('   Medicamentos recuperados:', JSON.stringify(verificacao.rows[0].medicamentos, null, 2));
      
      // Comparar dados originais com salvos
      const medicamentosSalvos = verificacao.rows[0].medicamentos;
      const saoIguais = JSON.stringify(medicamentosSimples) === JSON.stringify(medicamentosSalvos);
      console.log('   Dados idênticos aos originais?', saoIguais ? '✅ SIM' : '❌ NÃO');
      
      await pool.query('COMMIT');
      console.log('\n✅ Transação confirmada - prescrição salva permanentemente');
      
    } catch (error) {
      await pool.query('ROLLBACK');
      console.log('\n❌ ERRO na inserção:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalhes:', error.detail);
      console.log('   Posição:', error.position);
      console.log('   Where:', error.where);
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

testarPrescricaoFinal();