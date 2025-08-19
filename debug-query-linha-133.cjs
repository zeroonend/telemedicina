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

async function debugQueryLinha133() {
  try {
    console.log('🔍 DEBUG - QUERY EXATA DA LINHA 133 DA API');
    console.log('==========================================');
    
    // Buscar consulta válida
    const consultaResult = await pool.query(`
      SELECT c.id, c.medico_id, c.paciente_id, c.status
      FROM consultas c
      LEFT JOIN prescricoes p ON c.id = p.consulta_id
      WHERE p.id IS NULL
        AND c.status IN ('em_andamento', 'finalizada')
      LIMIT 1;
    `);
    
    if (consultaResult.rows.length === 0) {
      console.log('❌ Nenhuma consulta disponível');
      return;
    }
    
    const consulta = consultaResult.rows[0];
    console.log('✅ Consulta encontrada:', consulta.id);
    
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
    
    console.log('\n📋 Medicamentos originais:', JSON.stringify(medicamentosSimples, null, 2));
    
    // Serialização exata da API (linha antes da 133)
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('\n🔧 JSON string serializada:', medicamentosJson);
    console.log('   Tipo:', typeof medicamentosJson);
    console.log('   Tamanho:', medicamentosJson.length);
    console.log('   Primeiro char:', medicamentosJson.charAt(0));
    console.log('   Último char:', medicamentosJson.charAt(medicamentosJson.length - 1));
    
    // Verificar se é JSON válido
    try {
      const testeParse = JSON.parse(medicamentosJson);
      console.log('✅ JSON válido - parse bem-sucedido');
    } catch (parseError) {
      console.log('❌ JSON inválido:', parseError.message);
      return;
    }
    
    console.log('\n💾 Executando query EXATA da linha 133...');
    
    // Query EXATA da linha 133 do prescricoes.ts
    const queryText = `
      INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
      VALUES ($1, $2, $3, $4, $5, true, NOW())
      RETURNING *
    `;
    
    const queryParams = [
      consulta.id,
      consulta.medico_id,
      medicamentosJson, // String JSON exata
      'Manter repouso e hidratação adequada',
      `Dr. ${consulta.medico_id}`
    ];
    
    console.log('\n🔍 Parâmetros da query:');
    console.log('   $1 (consulta_id):', queryParams[0], typeof queryParams[0]);
    console.log('   $2 (medico_id):', queryParams[1], typeof queryParams[1]);
    console.log('   $3 (medicamentos):', queryParams[2], typeof queryParams[2]);
    console.log('   $4 (orientacoes):', queryParams[4], typeof queryParams[4]);
    console.log('   $5 (assinatura):', queryParams[4], typeof queryParams[4]);
    
    // Executar com tratamento de erro detalhado
    try {
      const result = await pool.query(queryText, queryParams);
      
      console.log('\n✅ SUCESSO! Prescrição inserida:');
      console.log('   ID:', result.rows[0].id);
      console.log('   Medicamentos salvos:', JSON.stringify(result.rows[0].medicamentos, null, 2));
      
    } catch (insertError) {
      console.log('\n❌ ERRO na inserção:');
      console.log('   Mensagem:', insertError.message);
      console.log('   Código:', insertError.code);
      console.log('   Detalhes:', insertError.detail);
      console.log('   Posição:', insertError.position);
      console.log('   Where:', insertError.where);
      console.log('   Severity:', insertError.severity);
      console.log('   File:', insertError.file);
      console.log('   Line:', insertError.line);
      console.log('   Routine:', insertError.routine);
      
      // Tentar identificar o problema específico
      if (insertError.message.includes('invalid input syntax for type json')) {
        console.log('\n🔍 ANÁLISE DO ERRO JSON:');
        console.log('   String que causou erro:', medicamentosJson);
        console.log('   Caracteres especiais:', medicamentosJson.split('').map(c => c.charCodeAt(0)).join(','));
        
        // Testar com dados mais simples
        console.log('\n🧪 Testando com JSON mais simples...');
        const jsonSimples = JSON.stringify([{nome: 'Teste', dosagem: '1x'}]);
        
        try {
          const testResult = await pool.query(queryText, [
            consulta.id,
            consulta.medico_id,
            jsonSimples,
            'Teste',
            'Dr. Teste'
          ]);
          console.log('✅ JSON simples funcionou!');
        } catch (testError) {
          console.log('❌ JSON simples também falhou:', testError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Conexão fechada');
  }
}

debugQueryLinha133();