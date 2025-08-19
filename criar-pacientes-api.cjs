const axios = require('axios');

// Configuração
const API_URL = 'http://localhost:3002/api';

// Dados dos pacientes de teste
const pacientesTeste = [
  {
    nome: 'Maria Silva',
    email: 'maria.silva@email.com',
    senha: 'senha123',
    tipo: 'paciente',
    telefone: '(11) 99999-1111',
    cpf: '123.456.789-01'
  },
  {
    nome: 'João Santos',
    email: 'joao.santos@email.com',
    senha: 'senha123',
    tipo: 'paciente',
    telefone: '(11) 99999-2222',
    cpf: '987.654.321-02'
  },
  {
    nome: 'Ana Costa',
    email: 'ana.costa@email.com',
    senha: 'senha123',
    tipo: 'paciente',
    telefone: '(11) 99999-3333',
    cpf: '456.789.123-03'
  }
];

// Função para criar pacientes de teste
async function criarPacientesTeste() {
  console.log('🚀 Iniciando criação de pacientes de teste...');
  
  for (const paciente of pacientesTeste) {
    try {
      console.log(`📋 Criando paciente: ${paciente.nome}`);
      
      try {
        const response = await axios.post(`${API_URL}/auth/register`, paciente, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Paciente criado: ${paciente.nome} (ID: ${response.data.id})`);
      } catch (error) {
        if (error.response && error.response.data.message && error.response.data.message.includes('já existe')) {
          console.log(`ℹ️ Paciente ${paciente.nome} já existe, pulando...`);
        } else {
          console.log(`❌ Erro ao criar ${paciente.nome}:`, error.response?.data?.message || error.message);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao criar ${paciente.nome}:`, error.message);
    }
  }
  
  console.log('✅ Processo de criação de pacientes concluído!');
}

// Executar
criarPacientesTeste().catch(console.error);