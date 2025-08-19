const { Pool } = require('pg');
require('dotenv').config();

// Configuração do banco de dados
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false
});

async function corrigirPrescricoes() {
  try {
    console.log('🔧 Corrigindo prescrições órfãs...');
    
    // 1. Verificar prescrições com consulta_id inválido
    console.log('\n🔍 Verificando prescrições órfãs:');
    const prescricoesOrfas = await pool.query(`
      SELECT p.id, p.consulta_id, p.medico_id, p.criado_em
      FROM prescricoes p
      LEFT JOIN consultas c ON p.consulta_id = c.id
      WHERE c.id IS NULL
      LIMIT 10
    `);
    
    console.log(`Encontradas ${prescricoesOrfas.rows.length} prescrições órfãs`);
    
    if (prescricoesOrfas.rows.length > 0) {
      console.table(prescricoesOrfas.rows);
      
      // 2. Buscar médicos e pacientes disponíveis
      const medicos = await pool.query(`
        SELECT id, nome FROM usuarios WHERE tipo = 'medico' AND ativo = true LIMIT 5
      `);
      
      const pacientes = await pool.query(`
        SELECT id, nome FROM usuarios WHERE tipo = 'paciente' AND ativo = true LIMIT 5
      `);
      
      console.log('\n👨‍⚕️ Médicos disponíveis:');
      console.table(medicos.rows);
      
      console.log('\n👤 Pacientes disponíveis:');
      console.table(pacientes.rows);
      
      if (medicos.rows.length > 0 && pacientes.rows.length > 0) {
        // 3. Criar consultas para as prescrições órfãs
        console.log('\n🏥 Criando consultas para prescrições órfãs...');
        
        for (let i = 0; i < Math.min(prescricoesOrfas.rows.length, 5); i++) {
          const prescricao = prescricoesOrfas.rows[i];
          const medico = medicos.rows[i % medicos.rows.length];
          const paciente = pacientes.rows[i % pacientes.rows.length];
          
          // Criar uma consulta
          const novaConsulta = await pool.query(`
            INSERT INTO consultas (
              id, paciente_id, medico_id, data_hora, status, especialidade, 
              observacoes, valor, criado_em
            ) VALUES (
              gen_random_uuid(), $1, $2, $3, 'finalizada', 'Clínico Geral',
              'Consulta criada para corrigir prescrição órfã', 100.00, $4
            ) RETURNING id
          `, [
            paciente.id,
            prescricao.medico_id, // Usar o médico da prescrição
            prescricao.criado_em, // Data da consulta = data da prescrição
            prescricao.criado_em
          ]);
          
          const consultaId = novaConsulta.rows[0].id;
          
          // Atualizar a prescrição com o novo consulta_id
          await pool.query(`
            UPDATE prescricoes 
            SET consulta_id = $1 
            WHERE id = $2
          `, [consultaId, prescricao.id]);
          
          console.log(`✅ Prescrição ${prescricao.id} vinculada à consulta ${consultaId}`);
        }
        
        // 4. Verificar se a correção funcionou
        console.log('\n🔍 Verificando após correção:');
        const verificacao = await pool.query(`
          SELECT 
            p.id, p.consulta_id, p.medico_id,
            c.id as consulta_existe,
            pac.nome as paciente_nome,
            med.nome as medico_nome
          FROM prescricoes p
          LEFT JOIN consultas c ON p.consulta_id = c.id
          LEFT JOIN usuarios pac ON c.paciente_id = pac.id
          LEFT JOIN usuarios med ON p.medico_id = med.id
          ORDER BY p.criado_em DESC
          LIMIT 5
        `);
        
        console.table(verificacao.rows);
        
        // 5. Testar a query da API novamente
        console.log('\n🧪 Testando query da API após correção:');
        const queryAPI = `
          SELECT 
            p.id, p.consulta_id, p.medico_id, c.paciente_id, p.medicamentos, 
            p.orientacoes as observacoes_gerais, p.ativa as status, p.criado_em,
            pac.nome as paciente_nome, pac.email as paciente_email,
            med.nome as medico_nome
          FROM prescricoes p
          JOIN consultas c ON p.consulta_id = c.id
          JOIN usuarios pac ON c.paciente_id = pac.id
          JOIN usuarios med ON p.medico_id = med.id
          WHERE 1=1
          ORDER BY p.criado_em DESC
          LIMIT 3
        `;
        
        const resultadoAPI = await pool.query(queryAPI);
        console.log(`Resultados da query da API: ${resultadoAPI.rows.length} registros`);
        if (resultadoAPI.rows.length > 0) {
          console.table(resultadoAPI.rows.map(row => ({
            id: row.id.substring(0, 8) + '...',
            paciente: row.paciente_nome,
            medico: row.medico_nome,
            status: row.status
          })));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao corrigir prescrições:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

corrigirPrescricoes();