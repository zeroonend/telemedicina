import { Router, Request, Response } from 'express';
import { generateToken, hashPassword, comparePassword } from '../utils/auth.js';
import { query, createUsersTable } from '../database/connection.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();

// Interface para dados de cadastro
interface RegisterData {
  email: string;
  password: string;
  nome: string;
  tipo: 'paciente' | 'medico';
  crm?: string;
  especialidade?: string;
  telefone?: string;
  cpf?: string;
}

// Interface para dados de login
interface LoginData {
  email: string;
  password: string;
}

// POST /api/auth/register - Cadastro de usuários
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, nome, tipo, crm, especialidade, telefone, cpf }: RegisterData = req.body;

    // Validações básicas
    if (!email || !password || !nome || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios: email, password, nome, tipo' });
    }

    if (!['paciente', 'medico'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo deve ser "paciente" ou "medico"' });
    }

    // Validação específica para médicos
    if (tipo === 'medico' && !crm) {
      return res.status(400).json({ error: 'CRM é obrigatório para médicos' });
    }

    // Garantir que a tabela users existe
    await createUsersTable();

    // Verificar se o email já existe
    const existingUser = await query('SELECT id FROM usuarios WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Inserir usuário no banco de dados
    const insertQuery = `
      INSERT INTO usuarios (email, senha_hash, nome, tipo, telefone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, nome, tipo, telefone, criado_em
    `;
    
    const result = await query(insertQuery, [
      email,
      passwordHash,
      nome,
      tipo,
      telefone || null
    ]);

    const newUser = result.rows[0];

    // Gerar token JWT
    const token = generateToken(newUser.id.toString(), newUser.email, newUser.tipo);

    res.status(201).json({
      success: true,
      message: 'Usuário cadastrado com sucesso',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nome: newUser.nome,
        tipo: newUser.tipo,
        telefone: newUser.telefone
      },
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro no cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login - Login de usuários
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginData = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário no banco de dados
    const userQuery = 'SELECT * FROM usuarios WHERE email = $1 AND ativo = true';
    const result = await query(userQuery, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.senha_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    // Gerar token JWT
    const token = generateToken(user.id.toString(), user.email, user.tipo);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        tipo: user.tipo,
        telefone: user.telefone
      },
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Obter dados do usuário autenticado
router.get('/me', async (req: Request, res: Response) => {
  try {
    // Simular usuário autenticado
    const user = {
      id: '1',
      email: 'usuario@teste.com',
      nome: 'Usuário Teste',
      tipo: 'paciente'
    };

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/validate - Validar token JWT
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    // Usar jwt já importado
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: string };
      
      // Buscar dados do usuário para confirmar que ainda está ativo
      const userQuery = 'SELECT id, email, nome, tipo, ativo FROM usuarios WHERE id = $1 AND ativo = true';
      const result = await query(userQuery, [decoded.id]);

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
      }

      const user = result.rows[0];
      res.json({
        success: true,
        message: 'Token válido',
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          tipo: user.tipo
        }
      });
    } catch (jwtError) {
      return res.status(403).json({ error: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro na validação do token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/logout - Logout (apenas retorna sucesso)
router.post('/logout', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;