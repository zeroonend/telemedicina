const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'telemedicina',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

/**
 * Função para verificar a quantidade de dados em cada tabela
 */
async function verificarDadosBanco() {
  try {
    console.log('🔍 Verificando dados no banco de dados...');
    console.log('=' .repeat(50));
    
    // Lista de tabelas para verificar
    const tabelas = [
      'usuarios',
      'consultas', 
      'prescricoes',
      'historico_medico',
      'avaliacoes',
      'pagamentos'
    ];
    
    for (const tabela of tabelas) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as total FROM ${tabela}`);
        const total = parseInt(result.rows[0].total);
        
        console.log(`📊 ${tabela.padEnd(20)} | ${total.toString().padStart(5)} registros`);
        
        // Se houver dados, mostrar alguns exemplos
        if (total > 0) {
          const exemplos = await pool.query(`SELECT * FROM ${tabela} LIMIT 3`);
          console.log(`   Primeiros registros:`);
          exemplos.rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ID: ${row.id || 'N/A'} | Nome/Título: ${row.nome || row.diagnostico || row.status || 'N/A'}`);
          });
        }
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${tabela.padEnd(20)} | Erro: ${error.message}`);
      }
    }
    
    console.log('=' .repeat(50));
    
    // Verificar usuários por tipo
    console.log('👥 Distribuição de usuários por tipo:');
    try {
      const tiposResult = await pool.query(`
        SELECT tipo, COUNT(*) as total 
        FROM usuarios 
        GROUP BY tipo
      `);
      
      tiposResult.rows.forEach(row => {
        console.log(`   ${row.tipo}: ${row.total} usuários`);
      });
    } catch (error) {
      console.log(`❌ Erro ao verificar tipos de usuários: ${error.message}`);
    }
    
    console.log('');
    
    // Verificar se há dados relacionados
    console.log('🔗 Verificando relacionamentos:');
    try {
      const relacionamentos = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM prescricoes WHERE paciente_id IS NOT NULL) as prescricoes_com_paciente,
          (SELECT COUNT(*) FROM historico_medico WHERE paciente_id IS NOT NULL) as historico_com_paciente,
          (SELECT COUNT(*) FROM consultas WHERE paciente_id IS NOT NULL) as consultas_com_paciente
      `);
      
      const rel = relacionamentos.rows[0];
      console.log(`   Prescrições com paciente: ${rel.prescricoes_com_paciente}`);
      console.log(`   Histórico com paciente: ${rel.historico_com_paciente}`);
      console.log(`   Consultas com paciente: ${rel.consultas_com_paciente}`);
      
    } catch (error) {
      console.log(`❌ Erro ao verificar relacionamentos: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  } finally {
    await pool.end();
  }
}

// Executar verificação
verificarDadosBanco();