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
 * Função para verificar a estrutura das tabelas principais
 */
async function verificarEstruturaTabelasPrincipais() {
  try {
    console.log('🔍 Verificando estrutura das tabelas principais...');
    console.log('=' .repeat(60));
    
    const tabelas = ['prescricoes', 'historico_medico', 'usuarios'];
    
    for (const tabela of tabelas) {
      console.log(`\n📋 Estrutura da tabela: ${tabela}`);
      console.log('-' .repeat(40));
      
      try {
        const result = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = $1 
          ORDER BY ordinal_position
        `, [tabela]);
        
        result.rows.forEach(col => {
          console.log(`  ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
        });
        
        // Mostrar alguns dados de exemplo
        console.log('\n📊 Dados de exemplo:');
        const exemplos = await pool.query(`SELECT * FROM ${tabela} LIMIT 2`);
        if (exemplos.rows.length > 0) {
          console.log('  Colunas:', Object.keys(exemplos.rows[0]).join(', '));
          exemplos.rows.forEach((row, index) => {
            console.log(`  Registro ${index + 1}:`, JSON.stringify(row, null, 2).substring(0, 200) + '...');
          });
        } else {
          console.log('  Nenhum dado encontrado.');
        }
        
      } catch (error) {
        console.log(`❌ Erro ao verificar ${tabela}: ${error.message}`);
      }
    }
    
    // Verificar relacionamentos específicos
    console.log('\n🔗 Verificando relacionamentos específicos:');
    console.log('-' .repeat(40));
    
    try {
      // Prescrições com dados de paciente
      const prescricoesComPaciente = await pool.query(`
        SELECT COUNT(*) as total
        FROM prescricoes p
        INNER JOIN usuarios u ON p.usuario_id = u.id
        WHERE u.tipo = 'paciente'
      `);
      console.log(`Prescrições com paciente: ${prescricoesComPaciente.rows[0].total}`);
      
      // Histórico médico com dados de paciente
      const historicoComPaciente = await pool.query(`
        SELECT COUNT(*) as total
        FROM historico_medico h
        INNER JOIN usuarios u ON h.usuario_id = u.id
        WHERE u.tipo = 'paciente'
      `);
      console.log(`Histórico médico com paciente: ${historicoComPaciente.rows[0].total}`);
      
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
verificarEstruturaTabelasPrincipais();