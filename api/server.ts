import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Importar rotas
import authRoutes from './routes/auth.js';
import consultasRoutes from './routes/consultas.js';
import prescricoesRoutes from './routes/prescricoes.js';
import pagamentosRoutes from './routes/pagamentos.js';
import avaliacoesRoutes from './routes/avaliacoes.js';
import historicoMedicoRoutes from './routes/historico-medico.js';
import usuariosRoutes from './routes/usuarios.js';

// Configurar __dirname para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '../.env') });
// Forçar restart para aplicar correções JWT e nova porta 3002

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware de segurança
// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:*", "http://127.0.0.1:*", "https://api.stripe.com", "https://*.stripe.com", "wss://*.daily.co", "https://*.daily.co"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://agora.io", "https://web.agora.io", "https://js.stripe.com", "https://*.stripe.com"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Middleware CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://yourdomain.com'
    : (origin, callback) => {
        // Em desenvolvimento, aceitar qualquer localhost
        if (!origin || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Não permitido pelo CORS'));
        }
      },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/prescricoes', prescricoesRoutes);
app.use('/api/pagamentos', pagamentosRoutes);
app.use('/api/avaliacoes', avaliacoesRoutes);
app.use('/api/historico-medico', historicoMedicoRoutes);

// Rota de health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Rota para informações da API
app.get('/api', (req, res) => {
  res.json({
    name: 'Telemedicina API',
    version: '1.0.0',
    description: 'API para sistema de telemedicina',
    endpoints: {
      auth: '/api/auth',
      usuarios: '/api/usuarios',
      consultas: '/api/consultas',
      prescricoes: '/api/prescricoes',
      pagamentos: '/api/pagamentos',
      avaliacoes: '/api/avaliacoes',
      historico: '/api/historico-medico',
      health: '/api/health'
    },
    documentation: 'https://docs.yourdomain.com/api'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    availableRoutes: [
      'GET /api',
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/consultas',
      'POST /api/consultas',
      'GET /api/prescricoes',
      'POST /api/prescricoes',
      'GET /api/pagamentos',
      'POST /api/pagamentos',
      'GET /api/avaliacoes',
      'POST /api/avaliacoes',
      'GET /api/historico-medico/paciente/:id'
    ]
  });
});

// Middleware global de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  
  // Erro de validação do Joi
  if (err.isJoi) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.details.map((detail: any) => detail.message)
    });
  }
  
  // Erro de sintaxe JSON
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'Verifique a sintaxe do JSON enviado'
    });
  }
  
  // Erro de token JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido ou expirado'
    });
  }
  
  // Erro de conexão com banco de dados
  if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    return res.status(503).json({
      error: 'Serviço indisponível',
      message: 'Erro de conexão com o banco de dados'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Helpers de inicialização
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function checkDbWithRetries(pool: any, retries = 5, delayMs = 3000) {
  let lastErr: any;
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query('SELECT NOW()');
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`⚠️  Tentativa ${i}/${retries} de conexão ao DB falhou:`, (err as any)?.message || err);
      if (i < retries) await sleep(delayMs);
    }
  }
  throw lastErr;
}

// Função para inicializar o servidor
const startServer = async () => {
  try {
    // Testar conexão com banco de dados com retries
    const { default: pool } = await import('./config/database.js');
    try {
      await checkDbWithRetries(pool, 5, 3000);
      console.log('✅ Conexão com PostgreSQL estabelecida com sucesso');
    } catch (err) {
      console.warn('⚠️  Banco indisponível no momento. O servidor iniciará mesmo assim; rotas que dependem de DB podem falhar até a conexão estabilizar.');
      console.warn('Detalhes:', (err as any)?.message || err);
    }

    // Criar diretório de uploads se não existir
    const fs = await import('fs');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Diretório de uploads criado');
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API disponível em: http://localhost:${PORT}/api`);
      console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📋 Rotas disponíveis:');
        console.log('   POST /api/auth/register - Cadastro de usuário');
        console.log('   POST /api/auth/login - Login');
        console.log('   GET  /api/auth/me - Dados do usuário logado');
        console.log('   GET  /api/consultas - Listar consultas');
        console.log('   POST /api/consultas - Agendar consulta');
        console.log('   GET  /api/prescricoes - Listar prescrições');
        console.log('   POST /api/prescricoes - Criar prescrição');
        console.log('   GET  /api/pagamentos - Listar pagamentos');
        console.log('   POST /api/pagamentos - Criar pagamento');
        console.log('   GET  /api/avaliacoes - Listar avaliações');
        console.log('   POST /api/avaliacoes - Criar avaliação');
        console.log('   GET  /api/historico-medico/paciente/:id - Histórico médico');
        console.log('\n🔧 Para testar a API, use um cliente REST como Postman ou Insomnia');
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
};

// Tratamento de sinais do sistema
process.on('SIGTERM', () => {
  console.log('\n🛑 Recebido SIGTERM, encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Recebido SIGINT, encerrando servidor graciosamente...');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Inicializar servidor
startServer();

export default app;