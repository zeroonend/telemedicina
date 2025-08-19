const { Pool } = require('pg');

// Configuração do banco
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

async function debugPrescricoesTable() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA PRESCRICOES');
    console.log('===============================================');
    
    // Verificar estrutura da tabela prescricoes
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'prescricoes' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura da tabela prescricoes:');
    estrutura.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Testar inserção na tabela prescricoes
    console.log('\n🧪 Testando inserção na tabela prescricoes...');
    
    const medicamentosArray = [
      {
        nome: 'Paracetamol 500mg',
        dosagem: '1 comprimido',
        frequencia: 'A cada 8 horas',
        duracao: '7 dias',
        observacoes: 'Tomar após as refeições'
      }
    ];
    
    const medicamentosJson = JSON.stringify(medicamentosArray);
    console.log('   Medicamentos array:', medicamentosArray);
    console.log('   JSON string:', medicamentosJson);
    console.log('   Tipo:', typeof medicamentosJson);
    console.log('   Tamanho:', medicamentosJson.length);
    
    // Buscar uma consulta válida
    const consultaTest = await pool.query(`
      SELECT c.id, c.paciente_id, c.medico_id
      FROM consultas c
      WHERE c.status = 'agendada'
      LIMIT 1
    `);
    
    if (consultaTest.rows.length > 0) {
      const consulta = consultaTest.rows[0];
      
      try {
        console.log('\n   Tentando inserir prescrição...');
        const insertResult = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING *`,
          [
            consulta.id,
            consulta.medico_id,
            medicamentosJson,
            'Teste de inserção',
            `Dr. ${consulta.medico_id}`
          ]
        );
        
        console.log('\n✅ SUCESSO! Prescrição inserida:');
        console.log('   ID:', insertResult.rows[0].id);
        console.log('   Medicamentos salvos:', insertResult.rows[0].medicamentos);
        console.log('   Tipo dos medicamentos salvos:', typeof insertResult.rows[0].medicamentos);
        
        // Testar parse
        try {
          const medicamentosParsed = JSON.parse(insertResult.rows[0].medicamentos);
          console.log('   Parse bem-sucedido:', medicamentosParsed);
        } catch (parseError) {
          console.log('   ❌ Erro no parse:', parseError.message);
        }
        
      } catch (insertError) {
        console.log('\n❌ ERRO na inserção da prescrição:');
        console.log('   Mensagem:', insertError.message);
        console.log('   Código:', insertError.code);
        console.log('   Detalhes:', insertError.detail);
        console.log('   Where:', insertError.where);
      }
    } else {
      console.log('   Nenhuma consulta disponível para teste');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

debugPrescricoesTable();