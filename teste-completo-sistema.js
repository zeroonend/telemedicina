import fetch from 'node-fetch';
import puppeteer from 'puppeteer';

const API_BASE = 'http://localhost:3002/api';
const FRONTEND_URL = 'http://localhost:5173';

// Cores para output no terminal
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// Função para log colorido
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para aguardar um tempo
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Classe para testes de API
class APITester {
  constructor() {
    this.tokens = {};
    this.testData = {};
  }

  // Teste de autenticação
  async testarAutenticacao() {
    log('\n🔐 TESTANDO AUTENTICAÇÃO', 'cyan');
    
    try {
      // Teste de login do paciente
      log('  📝 Testando login do paciente...', 'blue');
      const loginPaciente = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'paciente@teste.com',
          password: '123456'
        })
      });
      
      const dadosPaciente = await loginPaciente.json();
      if (dadosPaciente.success) {
        this.tokens.paciente = dadosPaciente.token;
        this.testData.pacienteId = dadosPaciente.user.id;
        log('    ✅ Login do paciente: SUCESSO', 'green');
      } else {
        log('    ❌ Login do paciente: FALHOU', 'red');
        return false;
      }

      // Teste de login do médico
      log('  📝 Testando login do médico...', 'blue');
      const loginMedico = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'medico@teste.com',
          password: '123456'
        })
      });
      
      const dadosMedico = await loginMedico.json();
      if (dadosMedico.success) {
        this.tokens.medico = dadosMedico.token;
        this.testData.medicoId = dadosMedico.user.id;
        log('    ✅ Login do médico: SUCESSO', 'green');
      } else {
        log('    ❌ Login do médico: FALHOU', 'red');
        return false;
      }

      // Teste de validação de token
      log('  📝 Testando validação de token...', 'blue');
      const validacao = await fetch(`${API_BASE}/auth/validate`, {
        headers: { 'Authorization': `Bearer ${this.tokens.paciente}` }
      });
      
      if (validacao.ok) {
        log('    ✅ Validação de token: SUCESSO', 'green');
      } else {
        log('    ❌ Validação de token: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro na autenticação: ${error.message}`, 'red');
      return false;
    }
  }

  // Teste de agendamento de consultas
  async testarAgendamento() {
    log('\n📅 TESTANDO AGENDAMENTO DE CONSULTAS', 'cyan');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tokens.paciente}`
      };

      // Criar consulta
      log('  📝 Testando criação de consulta...', 'blue');
      const novaConsulta = {
        medico_id: this.testData.medicoId,
        data_hora: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        especialidade: 'Clínica Geral',
        observacoes: 'Consulta de teste automatizado',
        valor: 150.00
      };

      const criarConsulta = await fetch(`${API_BASE}/consultas`, {
        method: 'POST',
        headers,
        body: JSON.stringify(novaConsulta)
      });

      const consultaCriada = await criarConsulta.json();
      if (consultaCriada.success) {
        this.testData.consultaId = consultaCriada.consulta.id;
        log('    ✅ Criação de consulta: SUCESSO', 'green');
      } else {
        log('    ❌ Criação de consulta: FALHOU', 'red');
        return false;
      }

      // Listar consultas
      log('  📝 Testando listagem de consultas...', 'blue');
      const listarConsultas = await fetch(`${API_BASE}/consultas`, { headers });
      const consultasResponse = await listarConsultas.json();
      
      if (consultasResponse.success && Array.isArray(consultasResponse.consultas) && consultasResponse.consultas.length > 0) {
        log('    ✅ Listagem de consultas: SUCESSO', 'green');
      } else {
        log('    ❌ Listagem de consultas: FALHOU', 'red');
        return false;
      }

      // Atualizar consulta
      log('  📝 Testando atualização de consulta...', 'blue');
      const atualizarConsulta = await fetch(`${API_BASE}/consultas/${this.testData.consultaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.tokens.medico}`
        },
        body: JSON.stringify({ status: 'em_andamento' })
      });

      if (atualizarConsulta.ok) {
        log('    ✅ Atualização de consulta: SUCESSO', 'green');
      } else {
        log('    ❌ Atualização de consulta: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro no agendamento: ${error.message}`, 'red');
      return false;
    }
  }

  // Teste de prescrições digitais
  async testarPrescricoes() {
    log('\n💊 TESTANDO PRESCRIÇÕES DIGITAIS', 'cyan');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tokens.medico}`
      };

      // Criar prescrição
      log('  📝 Testando criação de prescrição...', 'blue');
      const novaPrescricao = {
        consulta_id: this.testData.consultaId,
        medicamentos: [{
          nome: 'Paracetamol 500mg',
          dosagem: '1 comprimido',
          frequencia: 'A cada 8 horas',
          duracao: '7 dias',
          observacoes: 'Tomar após as refeições'
        }],
        orientacoes: 'Prescrição de teste automatizado'
      };

      const criarPrescricao = await fetch(`${API_BASE}/prescricoes`, {
        method: 'POST',
        headers,
        body: JSON.stringify(novaPrescricao)
      });

      const prescricaoCriada = await criarPrescricao.json();
      if (prescricaoCriada.success) {
        this.testData.prescricaoId = prescricaoCriada.prescricao.id;
        log('    ✅ Criação de prescrição: SUCESSO', 'green');
      } else {
        log('    ❌ Criação de prescrição: FALHOU', 'red');
        return false;
      }

      // Listar prescrições
      log('  📝 Testando listagem de prescrições...', 'blue');
      const listarPrescricoes = await fetch(`${API_BASE}/prescricoes`, { headers });
      const prescricoesResponse = await listarPrescricoes.json();
      
      if (prescricoesResponse.success && Array.isArray(prescricoesResponse.prescricoes) && prescricoesResponse.prescricoes.length > 0) {
        log('    ✅ Listagem de prescrições: SUCESSO', 'green');
      } else {
        log('    ❌ Listagem de prescrições: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro nas prescrições: ${error.message}`, 'red');
      return false;
    }
  }

  // Teste de histórico médico
  async testarHistoricoMedico() {
    log('\n📋 TESTANDO HISTÓRICO MÉDICO', 'cyan');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.tokens.medico}`
      };

      // Criar entrada no histórico
      log('  📝 Testando criação de entrada no histórico...', 'blue');
      const novaEntrada = {
        paciente_id: this.testData.pacienteId,
        tipo: 'consulta',
        descricao: 'Consulta de teste automatizado',
        diagnostico: 'Teste de sistema',
        tratamento: 'Observação e acompanhamento',
        observacoes: 'Entrada criada por teste automatizado'
      };

      const criarHistorico = await fetch(`${API_BASE}/historico-medico`, {
        method: 'POST',
        headers,
        body: JSON.stringify(novaEntrada)
      });

      const historicoCriado = await criarHistorico.json();
      if (historicoCriado.success) {
        this.testData.historicoId = historicoCriado.data.id;
        log('    ✅ Criação de entrada no histórico: SUCESSO', 'green');
      } else {
        log('    ❌ Criação de entrada no histórico: FALHOU', 'red');
        return false;
      }

      // Consultar histórico do paciente
      log('  📝 Testando consulta do histórico do paciente...', 'blue');
      const consultarHistorico = await fetch(`${API_BASE}/historico-medico/paciente/${this.testData.pacienteId}`, { headers });
      const historico = await consultarHistorico.json();
      
      if (historico.success && Array.isArray(historico.data) && historico.data.length > 0) {
        log('    ✅ Consulta do histórico: SUCESSO', 'green');
      } else {
        log('    ❌ Consulta do histórico: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro no histórico médico: ${error.message}`, 'red');
      return false;
    }
  }

  // Teste de conectividade da API
  async testarConectividadeAPI() {
    log('\n🌐 TESTANDO CONECTIVIDADE DA API', 'cyan');
    
    try {
      // Teste de health check
      log('  📝 Testando health check...', 'blue');
      const healthCheck = await fetch(`${API_BASE}/health`);
      
      if (healthCheck.ok) {
        log('    ✅ Health check: SUCESSO', 'green');
      } else {
        log('    ❌ Health check: FALHOU', 'red');
        return false;
      }

      // Teste de CORS
      log('  📝 Testando CORS...', 'blue');
      const corsTest = await fetch(`${API_BASE}/auth/validate`, {
        method: 'OPTIONS'
      });
      
      if (corsTest.ok) {
        log('    ✅ CORS: SUCESSO', 'green');
      } else {
        log('    ❌ CORS: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro na conectividade: ${error.message}`, 'red');
      return false;
    }
  }
}

// Classe para testes de frontend
class FrontendTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async inicializar() {
    try {
      this.browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });
      return true;
    } catch (error) {
      log(`❌ Erro ao inicializar browser: ${error.message}`, 'red');
      return false;
    }
  }

  async testarCarregamentoFrontend() {
    log('\n🖥️ TESTANDO CARREGAMENTO DO FRONTEND', 'cyan');
    
    try {
      // Teste de carregamento da página inicial
      log('  📝 Testando carregamento da página inicial...', 'blue');
      await this.page.goto(FRONTEND_URL, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const title = await this.page.title();
      if (title) {
        log('    ✅ Carregamento da página inicial: SUCESSO', 'green');
      } else {
        log('    ❌ Carregamento da página inicial: FALHOU', 'red');
        return false;
      }

      // Teste de elementos principais
      log('  📝 Testando elementos principais...', 'blue');
      const elementos = await this.page.evaluate(() => {
        return {
          hasHeader: !!document.querySelector('header, nav, .header, .navbar'),
          hasMain: !!document.querySelector('main, .main, .content'),
          hasFooter: !!document.querySelector('footer, .footer'),
          hasLinks: document.querySelectorAll('a').length > 0,
          hasButtons: document.querySelectorAll('button').length > 0
        };
      });

      if (elementos.hasMain && elementos.hasLinks) {
        log('    ✅ Elementos principais: SUCESSO', 'green');
      } else {
        log('    ❌ Elementos principais: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro no carregamento do frontend: ${error.message}`, 'red');
      return false;
    }
  }

  async testarNavegacao() {
    log('\n🧭 TESTANDO NAVEGAÇÃO DO FRONTEND', 'cyan');
    
    try {
      // Teste de navegação para login
      log('  📝 Testando navegação para login...', 'blue');
      await this.page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const loginForm = await this.page.$('form, .login-form, [data-testid="login-form"]');
      if (loginForm) {
        log('    ✅ Página de login: SUCESSO', 'green');
      } else {
        log('    ❌ Página de login: FALHOU', 'red');
        return false;
      }

      // Teste de navegação para cadastro
      log('  📝 Testando navegação para cadastro...', 'blue');
      await this.page.goto(`${FRONTEND_URL}/cadastro`, { waitUntil: 'networkidle2', timeout: 10000 });
      
      const cadastroForm = await this.page.$('form, .cadastro-form, [data-testid="cadastro-form"]');
      if (cadastroForm) {
        log('    ✅ Página de cadastro: SUCESSO', 'green');
      } else {
        log('    ❌ Página de cadastro: FALHOU', 'red');
        return false;
      }

      return true;
    } catch (error) {
      log(`    ❌ Erro na navegação: ${error.message}`, 'red');
      return false;
    }
  }

  async finalizar() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Função principal de teste
async function executarTestesCompletos() {
  log('🚀 INICIANDO TESTES COMPLETOS DO SISTEMA DE TELEMEDICINA', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  const resultados = {
    api: {},
    frontend: {},
    geral: { sucessos: 0, falhas: 0 }
  };

  // Testes de API
  const apiTester = new APITester();
  
  resultados.api.conectividade = await apiTester.testarConectividadeAPI();
  resultados.api.autenticacao = await apiTester.testarAutenticacao();
  
  if (resultados.api.autenticacao) {
    resultados.api.agendamento = await apiTester.testarAgendamento();
    resultados.api.prescricoes = await apiTester.testarPrescricoes();
    resultados.api.historico = await apiTester.testarHistoricoMedico();
  }

  // Testes de Frontend
  const frontendTester = new FrontendTester();
  const frontendInicializado = await frontendTester.inicializar();
  
  if (frontendInicializado) {
    resultados.frontend.carregamento = await frontendTester.testarCarregamentoFrontend();
    resultados.frontend.navegacao = await frontendTester.testarNavegacao();
    await frontendTester.finalizar();
  }

  // Contabilizar resultados
  Object.values(resultados.api).forEach(resultado => {
    if (resultado) resultados.geral.sucessos++;
    else resultados.geral.falhas++;
  });
  
  Object.values(resultados.frontend).forEach(resultado => {
    if (resultado) resultados.geral.sucessos++;
    else resultados.geral.falhas++;
  });

  // Relatório final
  log('\n' + '=' .repeat(60), 'magenta');
  log('📊 RELATÓRIO FINAL DOS TESTES', 'magenta');
  log('=' .repeat(60), 'magenta');
  
  log('\n🔧 TESTES DE API:', 'cyan');
  log(`  Conectividade: ${resultados.api.conectividade ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.api.conectividade ? 'green' : 'red');
  log(`  Autenticação: ${resultados.api.autenticacao ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.api.autenticacao ? 'green' : 'red');
  log(`  Agendamento: ${resultados.api.agendamento ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.api.agendamento ? 'green' : 'red');
  log(`  Prescrições: ${resultados.api.prescricoes ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.api.prescricoes ? 'green' : 'red');
  log(`  Histórico: ${resultados.api.historico ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.api.historico ? 'green' : 'red');
  
  log('\n🖥️ TESTES DE FRONTEND:', 'cyan');
  log(`  Carregamento: ${resultados.frontend.carregamento ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.frontend.carregamento ? 'green' : 'red');
  log(`  Navegação: ${resultados.frontend.navegacao ? '✅ PASSOU' : '❌ FALHOU'}`, resultados.frontend.navegacao ? 'green' : 'red');
  
  log('\n📈 RESUMO GERAL:', 'cyan');
  log(`  Sucessos: ${resultados.geral.sucessos}`, 'green');
  log(`  Falhas: ${resultados.geral.falhas}`, 'red');
  log(`  Taxa de Sucesso: ${((resultados.geral.sucessos / (resultados.geral.sucessos + resultados.geral.falhas)) * 100).toFixed(1)}%`, 
      resultados.geral.falhas === 0 ? 'green' : 'yellow');
  
  if (resultados.geral.falhas === 0) {
    log('\n🎉 TODOS OS TESTES PASSARAM! SISTEMA 100% FUNCIONAL!', 'green');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.', 'yellow');
  }
  
  log('\n' + '=' .repeat(60), 'magenta');
}

// Executar testes
executarTestesCompletos().catch(error => {
  log(`❌ Erro fatal durante os testes: ${error.message}`, 'red');
  process.exit(1);
});