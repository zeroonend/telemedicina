import { Pool } from 'pg';

// Configuração do banco de dados
const pool = new Pool({
  host: '93.127.210.141',
  port: 5432,
  database: 'trae_telemedicina',
  user: 'app_telemedicina',
  password: '12345678'
});

async function checkConstraints() {
  try {
    console.log('🔍 Verificando constraints da tabela consultas...');
    
    // Verificar constraints CHECK
    const checkConstraints = await pool.query(`
      SELECT 
        conname as constraint_name,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'consultas'::regclass 
        AND contype = 'c'
    `);
    
    console.log('\n📋 Constraints CHECK da tabela consultas:');
    if (checkConstraints.rows.length > 0) {
      checkConstraints.rows.forEach(constraint => {
        console.log(`- ${constraint.constraint_name}: ${constraint.constraint_definition}`);
      });
    } else {
      console.log('Nenhuma constraint CHECK encontrada.');
    }
    
    // Verificar todas as constraints
    const allConstraints = await pool.query(`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint 
      WHERE conrelid = 'consultas'::regclass
    `);
    
    console.log('\n🔗 Todas as constraints da tabela consultas:');
    allConstraints.rows.forEach(constraint => {
      const type = {
        'c': 'CHECK',
        'f': 'FOREIGN KEY',
        'p': 'PRIMARY KEY',
        'u': 'UNIQUE',
        'n': 'NOT NULL'
      }[constraint.constraint_type] || constraint.constraint_type;
      
      console.log(`- ${constraint.constraint_name} (${type}): ${constraint.constraint_definition}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar constraints:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();