const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

// Configuração idêntica à API
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const app = express();

// Middlewares EXATOS da API
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rota de teste que replica a lógica da API
app.post('/test-prescricao', async (req, res) => {
  try {
    console.log('\n🔍 Dados recebidos no req.body:');
    console.log('Body completo:', req.body);
    console.log('Tipo do body:', typeof req.body);
    
    const { medicamentos } = req.body;
    console.log('\n🔍 Medicamentos extraídos:');
    console.log('medicamentos:', medicamentos);
    console.log('Tipo dos medicamentos:', typeof medicamentos);
    console.log('É array?', Array.isArray(medicamentos));
    
    // Processar medicamentos exatamente como a API
    const medicamentosSimples = medicamentos.map((med) => ({
      nome: med.nome,
      dosagem: med.dosagem,
      frequencia: med.frequencia,
      duracao: med.duracao,
      observacoes: med.observacoes || ''
    }));
    
    console.log('\n🔍 Medicamentos processados:');
    console.log('medicamentosSimples:', medicamentosSimples);
    console.log('Tipo dos medicamentos processados:', typeof medicamentosSimples);
    
    // Criar JSON string exatamente como a API
    const medicamentosJson = JSON.stringify(medicamentosSimples);
    console.log('\n🔍 JSON string criada:');
    console.log('medicamentosJson:', medicamentosJson);
    console.log('Tipo da JSON string:', typeof medicamentosJson);
    console.log('Tamanho da JSON string:', medicamentosJson.length);
    
    // Verificar se a string é válida JSON
    try {
      const parsed = JSON.parse(medicamentosJson);
      console.log('✅ JSON é válido');
    } catch (e) {
      console.log('❌ JSON inválido:', e.message);
      return res.status(400).json({ error: 'JSON inválido' });
    }
    
    // Usar UUIDs válidos do banco
    const consulta_id = '32610a5e-74bf-45db-97cc-6fdd780b5e44';
    const medico_id = '7e951e2b-4a41-48f3-ba0c-73a07dcd197c';
    const orientacoes = 'Teste via Express';
    
    console.log('\n🔍 Parâmetros da query:');
    console.log('consulta_id:', consulta_id, typeof consulta_id);
    console.log('medico_id:', medico_id, typeof medico_id);
    console.log('medicamentosJson:', medicamentosJson, typeof medicamentosJson);
    console.log('orientacoes:', orientacoes, typeof orientacoes);
    
    // Iniciar transação
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Query EXATA da API
      const query = `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
           VALUES ($1, $2, $3, $4, $5, true, NOW())
           RETURNING *`;
      
      const params = [consulta_id, medico_id, medicamentosJson, orientacoes || '', `Dr. ${medico_id}`];
      
      console.log('\n🔍 Query SQL:');
      console.log(query);
      console.log('\n🔍 Parâmetros:');
      params.forEach((param, index) => {
        console.log(`$${index + 1}:`, param, `(${typeof param})`);
      });
      
      console.log('\n🚀 Executando query via Express...');
      
      const result = await client.query(query, params);
      
      console.log('✅ Prescrição inserida com sucesso via Express!');
      console.log('ID da prescrição:', result.rows[0].id);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Prescrição criada com sucesso via Express',
        prescricao_id: result.rows[0].id
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Erro na query via Express:', error.message);
      console.error('Código do erro:', error.code);
      console.error('Detalhes:', error.detail);
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Erro geral via Express:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor de teste
const PORT = 3003;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
  console.log('📍 Teste com: POST http://localhost:3003/test-prescricao');
  
  // Fazer requisição de teste automaticamente
  setTimeout(async () => {
    try {
      const fetch = (await import('node-fetch')).default;
      
      const testData = {
        medicamentos: [
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
        ]
      };
      
      console.log('\n🧪 Fazendo requisição de teste...');
      console.log('Dados enviados:', JSON.stringify(testData, null, 2));
      
      const response = await fetch(`http://localhost:${PORT}/test-prescricao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      console.log('\n📋 Resposta do servidor:');
      console.log('Status:', response.status);
      console.log('Resultado:', result);
      
      process.exit(0);
      
    } catch (error) {
      console.error('❌ Erro na requisição de teste:', error);
      process.exit(1);
    }
  }, 1000);
});