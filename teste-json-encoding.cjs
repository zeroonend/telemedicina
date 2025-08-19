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

async function testarEncodingJSON() {
  try {
    console.log('🔍 TESTANDO ENCODING JSON');
    console.log('========================');
    
    // Dados exatos da API
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
    
    console.log('1. Dados originais:', medicamentosSimples);
    
    // Teste 1: JSON.stringify normal
    const jsonString1 = JSON.stringify(medicamentosSimples);
    console.log('\n2. JSON.stringify normal:');
    console.log('String:', jsonString1);
    console.log('Tipo:', typeof jsonString1);
    console.log('Tamanho:', jsonString1.length);
    console.log('Primeiro char code:', jsonString1.charCodeAt(0));
    console.log('Último char code:', jsonString1.charCodeAt(jsonString1.length - 1));
    
    // Teste 2: JSON.stringify com replacer
    const jsonString2 = JSON.stringify(medicamentosSimples, null, 0);
    console.log('\n3. JSON.stringify com replacer:');
    console.log('String:', jsonString2);
    console.log('Igual ao normal?', jsonString1 === jsonString2);
    
    // Teste 3: Verificar se há caracteres especiais
    console.log('\n4. Análise de caracteres:');
    for (let i = 0; i < Math.min(50, jsonString1.length); i++) {
      const char = jsonString1[i];
      const code = jsonString1.charCodeAt(i);
      if (code > 127) {
        console.log(`Char especial na posição ${i}: '${char}' (code: ${code})`);
      }
    }
    
    // Teste 4: Tentar inserir no banco
    console.log('\n5. Testando inserção no PostgreSQL...');
    
    await pool.query('BEGIN');
    
    try {
      // Teste com string JSON normal
      console.log('Tentativa 1: String JSON normal');
      const result1 = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING id, medicamentos`,
        ['test-json-1', 'test-medico', jsonString1, 'Teste encoding', 'Dr. Teste']
      );
      console.log('✅ Sucesso com string JSON normal');
      console.log('ID inserido:', result1.rows[0].id);
      console.log('Medicamentos salvos:', result1.rows[0].medicamentos);
      
    } catch (error1) {
      console.log('❌ Erro com string JSON normal:', error1.message);
      console.log('Detalhes:', error1.detail);
      
      // Teste com cast explícito
      try {
        console.log('\nTentativa 2: Cast explícito para JSONB');
        const result2 = await pool.query(
          `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, $3::jsonb, $4, $5, true, NOW())
           RETURNING id, medicamentos`,
          ['test-json-2', 'test-medico', jsonString1, 'Teste encoding cast', 'Dr. Teste']
        );
        console.log('✅ Sucesso com cast explícito');
        console.log('ID inserido:', result2.rows[0].id);
        
      } catch (error2) {
        console.log('❌ Erro com cast explícito:', error2.message);
        console.log('Detalhes:', error2.detail);
        
        // Teste com escape manual
        try {
          console.log('\nTentativa 3: Escape manual');
          const escapedJson = jsonString1.replace(/'/g, "''");
          const result3 = await pool.query(
            `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
             VALUES ($1, $2, $3, $4, $5, true, NOW())
             RETURNING id, medicamentos`,
            ['test-json-3', 'test-medico', escapedJson, 'Teste escape', 'Dr. Teste']
          );
          console.log('✅ Sucesso com escape manual');
          
        } catch (error3) {
          console.log('❌ Erro com escape manual:', error3.message);
          console.log('Detalhes:', error3.detail);
        }
      }
    }
    
    await pool.query('ROLLBACK');
    console.log('\n🔄 Transação revertida (teste)');
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await pool.end();
    console.log('\n✅ Conexão fechada');
  }
}

testarEncodingJSON();