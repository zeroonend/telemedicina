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

async function verificarHistoricoMedico() {
  try {
    console.log('🔍 VERIFICANDO ESTRUTURA DA TABELA HISTORICO_MEDICO');
    console.log('==================================================');
    
    // Verificar estrutura da tabela
    const estrutura = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'historico_medico' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura da tabela historico_medico:');
    estrutura.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });
    
    // Verificar alguns registros existentes
    const registros = await pool.query(`
      SELECT id, paciente_id, consulta_id, medicamentos, observacoes, criado_em
      FROM historico_medico 
      ORDER BY criado_em DESC 
      LIMIT 3
    `);
    
    console.log('\n🔍 Exemplos de registros existentes:');
    if (registros.rows.length === 0) {
      console.log('   Nenhum registro encontrado');
    } else {
      registros.rows.forEach((row, index) => {
        console.log(`\n--- Registro ${index + 1} ---`);
        console.log(`   ID: ${row.id}`);
        console.log(`   Paciente: ${row.paciente_id}`);
        console.log(`   Consulta: ${row.consulta_id}`);
        console.log(`   Medicamentos: ${row.medicamentos}`);
        console.log(`   Tipo medicamentos: ${typeof row.medicamentos}`);
        console.log(`   Observações: ${row.observacoes}`);
        console.log(`   Criado em: ${row.criado_em}`);
      });
    }
    
    // Testar inserção simples
    console.log('\n🧪 Testando inserção simples...');
    
    const medicamentosTexto = 'Paracetamol - 500mg - 8/8h - 7 dias (Tomar após as refeições); Ibuprofeno - 400mg - 12/12h - 5 dias (Em caso de dor)';
    
    console.log('   Texto dos medicamentos:', medicamentosTexto);
    console.log('   Tipo:', typeof medicamentosTexto);
    console.log('   Tamanho:', medicamentosTexto.length);
    
    // Buscar uma consulta válida
    const consultaTest = await pool.query(`
      SELECT c.id, c.paciente_id
      FROM consultas c
      LEFT JOIN historico_medico h ON c.id = h.consulta_id
      WHERE h.id IS NULL
      LIMIT 1
    `);
    
    if (consultaTest.rows.length > 0) {
      const consulta = consultaTest.rows[0];
      
      try {
        const insertResult = await pool.query(
          `INSERT INTO historico_medico (paciente_id, consulta_id, medicamentos, observacoes, criado_em) 
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
           RETURNING *`,
          [
            consulta.paciente_id,
            consulta.id,
            medicamentosTexto,
            'Teste de inserção'
          ]
        );
        
        console.log('\n✅ SUCESSO! Registro inserido:');
        console.log('   ID:', insertResult.rows[0].id);
        console.log('   Medicamentos salvos:', insertResult.rows[0].medicamentos);
        
      } catch (insertError) {
        console.log('\n❌ ERRO na inserção:');
        console.log('   Mensagem:', insertError.message);
        console.log('   Código:', insertError.code);
        console.log('   Detalhes:', insertError.detail);
        console.log('   Posição:', insertError.position);
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

verificarHistoricoMedico();