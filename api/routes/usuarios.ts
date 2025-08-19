import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/usuarios - Listar usuários (com filtros)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { tipo, especialidade, page = 1, limit = 10, busca } = req.query;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    // Verificar permissões - apenas admins podem ver todos os usuários
    // Pacientes podem ver apenas médicos
    // Médicos podem ver apenas pacientes
    if (userType === 'paciente' && tipo !== 'medico') {
      return res.status(403).json({ error: 'Pacientes só podem visualizar médicos' });
    }
    
    if (userType === 'medico' && tipo !== 'paciente') {
      return res.status(403).json({ error: 'Médicos só podem visualizar pacientes' });
    }

    let query = `
      SELECT 
        id, nome, email, telefone, tipo, especialidade, crm,
        ativo, criado_em
      FROM usuarios 
      WHERE ativo = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtrar por tipo de usuário
    if (tipo) {
      query += ` AND tipo = $${++paramCount}`;
      params.push(tipo);
    }

    // Filtrar por especialidade (apenas para médicos)
    if (especialidade && tipo === 'medico') {
      query += ` AND especialidade = $${++paramCount}`;
      params.push(especialidade);
    }

    // Filtrar por busca (nome ou especialidade)
    if (busca) {
      query += ` AND (nome ILIKE $${++paramCount} OR especialidade ILIKE $${++paramCount})`;
      params.push(`%${busca}%`, `%${busca}%`);
      paramCount++; // Incrementar duas vezes pois usamos o parâmetro duas vezes
    }

    // Ordenação
    query += ' ORDER BY nome ASC';

    // Paginação
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Contar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM usuarios 
      WHERE ativo = true
    `;
    
    const countParams: any[] = [];
    let countParamCount = 0;

    if (tipo) {
      countQuery += ` AND tipo = $${++countParamCount}`;
      countParams.push(tipo);
    }

    if (especialidade && tipo === 'medico') {
      countQuery += ` AND especialidade = $${++countParamCount}`;
      countParams.push(especialidade);
    }

    if (busca) {
      countQuery += ` AND (nome ILIKE $${++countParamCount} OR especialidade ILIKE $${++countParamCount})`;
      countParams.push(`%${busca}%`, `%${busca}%`);
      countParamCount++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      usuarios: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/usuarios/:id - Obter detalhes de um usuário específico
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const usuarioId = req.params.id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    // Verificar permissões
    if (userType !== 'admin' && userId !== usuarioId) {
      // Pacientes podem ver dados de médicos
      // Médicos podem ver dados de pacientes
      const targetUserResult = await pool.query(
        'SELECT tipo FROM usuarios WHERE id = $1',
        [usuarioId]
      );

      if (targetUserResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const targetUserType = targetUserResult.rows[0].tipo;

      if (userType === 'paciente' && targetUserType !== 'medico') {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (userType === 'medico' && targetUserType !== 'paciente') {
        return res.status(403).json({ error: 'Acesso negado' });
      }
    }

    const result = await pool.query(
      `SELECT 
        id, nome, email, telefone, tipo, especialidade, crm,
        ativo, criado_em
      FROM usuarios 
      WHERE id = $1 AND ativo = true`,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({
      success: true,
      usuario: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/usuarios/medicos/horarios/:medico_id - Obter horários disponíveis de um médico
router.get('/medicos/horarios/:medico_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const medicoId = req.params.medico_id;
    const { data } = req.query;

    // Verificar se o médico existe
    const medicoResult = await pool.query(
      'SELECT id, nome FROM usuarios WHERE id = $1 AND tipo = $2 AND ativo = true',
      [medicoId, 'medico']
    );

    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    // Buscar consultas já agendadas para o médico na data especificada
    let consultasQuery = `
      SELECT horario 
      FROM consultas 
      WHERE medico_id = $1 AND status IN ('agendada', 'em_andamento')
    `;
    
    const params = [medicoId];
    
    if (data) {
      consultasQuery += ' AND data_consulta = $2';
      params.push(data as string);
    }

    const consultasResult = await pool.query(consultasQuery, params);
    const horariosOcupados = consultasResult.rows.map(row => row.horario);

    // Gerar horários disponíveis (exemplo: 8h às 18h, de hora em hora)
    const horariosDisponiveis = [];
    for (let hora = 8; hora <= 17; hora++) {
      const horario = `${hora.toString().padStart(2, '0')}:00`;
      if (!horariosOcupados.includes(horario)) {
        horariosDisponiveis.push(horario);
      }
    }

    res.json({
      success: true,
      medico: medicoResult.rows[0],
      data: data || new Date().toISOString().split('T')[0],
      horarios_disponiveis: horariosDisponiveis,
      horarios_ocupados: horariosOcupados
    });

  } catch (error) {
    console.error('Erro ao buscar horários do médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;