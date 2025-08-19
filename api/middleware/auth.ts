import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';

// Estender interface Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        nome: string;
        tipo: string;
        ativo: boolean;
      };
    }
  }
}

// Middleware de autenticação JWT
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    // Buscar dados atualizados do usuário
    const result = await pool.query(
      'SELECT id, email, nome, tipo, ativo FROM usuarios WHERE id = $1 AND ativo = true',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo' });
    }

    const user = result.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      tipo: user.tipo,
      ativo: user.ativo
    };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar tipo de usuário
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (!roles.includes(req.user.tipo)) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
};

// Middleware específico para médicos
export const requireMedico = requireRole(['medico', 'admin']);

// Middleware específico para pacientes
export const requirePaciente = requireRole(['paciente', 'admin']);

// Middleware específico para admins
export const requireAdmin = requireRole(['admin']);