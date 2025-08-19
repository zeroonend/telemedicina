import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Interface para dados de agendamento
interface AgendamentoData {
  medico_id: string;
  data_hora: string;
  especialidade: string;
  observacoes?: string;
  valor?: number;
}

// Interface para atualização de consulta
interface AtualizacaoConsulta {
  status?: 'agendada' | 'confirmada' | 'em_andamento' | 'finalizada' | 'cancelada';
  observacoes?: string;
  link_video?: string;
}

// POST /api/consultas - Agendar nova consulta (Paciente)
router.post('/', authenticateToken, requireRole(['paciente']), async (req: Request, res: Response) => {
  try {
    const { medico_id, data_hora, especialidade, observacoes, valor }: AgendamentoData = req.body;
    const paciente_id = req.user!.id;

    // Validações básicas
    if (!medico_id || !data_hora || !especialidade) {
      return res.status(400).json({ error: 'Campos obrigatórios: medico_id, data_hora, especialidade' });
    }

    // Verificar se o médico existe e está ativo
    const medicoResult = await pool.query(
      'SELECT id, nome, tipo FROM usuarios WHERE id = $1 AND tipo = $2 AND ativo = true',
      [medico_id, 'medico']
    );

    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado ou inativo' });
    }

    // Verificar se já existe consulta no mesmo horário para o médico
    const conflictResult = await pool.query(
      'SELECT id FROM consultas WHERE medico_id = $1 AND data_hora = $2 AND status NOT IN ($3, $4)',
      [medico_id, data_hora, 'cancelada', 'finalizada']
    );

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({ error: 'Horário já ocupado para este médico' });
    }

    // Verificar se a data/hora não é no passado
    const consultaDateTime = new Date(data_hora);
    if (consultaDateTime <= new Date()) {
      return res.status(400).json({ error: 'Não é possível agendar consultas no passado' });
    }

    // Inserir nova consulta
    const result = await pool.query(
      `INSERT INTO consultas (paciente_id, medico_id, data_hora, especialidade, status, observacoes, valor) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id, paciente_id, medico_id, data_hora, especialidade, status, observacoes, valor, criado_em`,
      [paciente_id, medico_id, data_hora, especialidade, 'agendada', observacoes || null, valor || 100.00]
    );

    const novaConsulta = result.rows[0];
    const medico = medicoResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Consulta agendada com sucesso',
      consulta: {
        ...novaConsulta,
        medico: {
          id: medico.id,
          nome: medico.nome,
          tipo: medico.tipo
        }
      }
    });

  } catch (error) {
    console.error('Erro ao agendar consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/consultas/paciente/:id - Buscar consultas de um paciente específico (Médico/Admin)
router.get('/paciente/:id', authenticateToken, requireRole(['medico', 'admin']), async (req: Request, res: Response) => {
  try {
    const { id: paciente_id } = req.params;
    const { status, data_inicio, data_fim, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        c.id, c.paciente_id, c.medico_id, c.data_hora, 
        c.status, c.especialidade, c.observacoes, c.link_video, c.valor, c.criado_em,
        p.nome as paciente_nome, p.email as paciente_email, p.telefone as paciente_telefone,
        m.nome as medico_nome, m.email as medico_email
      FROM consultas c
      JOIN usuarios p ON c.paciente_id = p.id
      JOIN usuarios m ON c.medico_id = m.id
      WHERE c.paciente_id = $1
    `;

    const params: any[] = [paciente_id];
    let paramCount = 1;

    // Filtros opcionais
    if (status) {
      query += ` AND c.status = $${++paramCount}`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND c.data_hora >= $${++paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND c.data_hora <= $${++paramCount}`;
      params.push(data_fim);
    }

    // Ordenação e paginação
    query += ` ORDER BY c.data_hora DESC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    const consultas = result.rows.map(row => ({
      id: row.id,
      data_hora: row.data_hora,
      status: row.status,
      especialidade: row.especialidade,
      observacoes: row.observacoes,
      link_video: row.link_video,
      valor: row.valor,
      criado_em: row.criado_em,
      paciente: {
        id: row.paciente_id,
        nome: row.paciente_nome,
        email: row.paciente_email,
        telefone: row.paciente_telefone
      },
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        email: row.medico_email
      }
    }));

    res.json({
      success: true,
      consultas,
      total: consultas.length
    });

  } catch (error) {
    console.error('Erro ao buscar consultas do paciente:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/consultas/disponibilidade - Verificar disponibilidade de horários
router.get('/disponibilidade', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { medico_id, data, horario_inicio, horario_fim } = req.query;

    if (!medico_id || !data) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios: medico_id, data' });
    }

    // Verificar se o médico existe
    const medicoResult = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1 AND tipo = $2 AND ativo = true',
      [medico_id, 'medico']
    );

    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado ou inativo' });
    }

    // Buscar consultas agendadas para o médico na data especificada
    let query = `
      SELECT data_hora, status
      FROM consultas 
      WHERE medico_id = $1 
        AND DATE(data_hora) = $2 
        AND status NOT IN ('cancelada', 'finalizada')
      ORDER BY data_hora
    `;

    const params = [medico_id, data];

    // Se especificado intervalo de horário, filtrar
    if (horario_inicio && horario_fim) {
      query = `
        SELECT data_hora, status
        FROM consultas 
        WHERE medico_id = $1 
          AND DATE(data_hora) = $2 
          AND TIME(data_hora) BETWEEN $3 AND $4
          AND status NOT IN ('cancelada', 'finalizada')
        ORDER BY data_hora
      `;
      params.push(horario_inicio, horario_fim);
    }

    const result = await pool.query(query, params);

    const horariosOcupados = result.rows.map(row => ({
      data_hora: row.data_hora,
      status: row.status
    }));

    // Gerar horários disponíveis (exemplo: 8h às 18h, intervalos de 1h)
    const horariosDisponiveis = [];
    const dataConsulta = new Date(data + 'T08:00:00');
    
    for (let hora = 8; hora <= 17; hora++) {
      const horario = new Date(dataConsulta);
      horario.setHours(hora, 0, 0, 0);
      
      // Verificar se não está ocupado
      const ocupado = horariosOcupados.some(ocupado => {
        const horaOcupada = new Date(ocupado.data_hora);
        return horaOcupada.getTime() === horario.getTime();
      });
      
      if (!ocupado && horario > new Date()) {
        horariosDisponiveis.push({
          data_hora: horario.toISOString(),
          disponivel: true
        });
      }
    }

    res.json({
      success: true,
      data,
      medico_id,
      horarios_ocupados: horariosOcupados,
      horarios_disponiveis: horariosDisponiveis
    });

  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/consultas - Listar consultas do usuário
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userType = req.user!.tipo;
    const { status, data_inicio, data_fim, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        c.id, c.paciente_id, c.medico_id, c.data_hora, 
        c.status, c.especialidade, c.observacoes, c.link_video, c.valor, c.criado_em,
        p.nome as paciente_nome, p.email as paciente_email, p.telefone as paciente_telefone,
        m.nome as medico_nome, m.email as medico_email
      FROM consultas c
      JOIN usuarios p ON c.paciente_id = p.id
      JOIN usuarios m ON c.medico_id = m.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtrar por usuário (paciente ou médico)
    if (userType === 'paciente') {
      query += ` AND c.paciente_id = $${++paramCount}`;
      params.push(userId);
    } else if (userType === 'medico') {
      query += ` AND c.medico_id = $${++paramCount}`;
      params.push(userId);
    }

    // Filtros opcionais
    if (status) {
      query += ` AND c.status = $${++paramCount}`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND c.data_hora >= $${++paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND c.data_hora <= $${++paramCount}`;
      params.push(data_fim);
    }

    // Ordenação e paginação
    query += ` ORDER BY c.data_hora DESC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Contar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM consultas c
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (userType === 'paciente') {
      countQuery += ` AND c.paciente_id = $${++countParamCount}`;
      countParams.push(userId);
    } else if (userType === 'medico') {
      countQuery += ` AND c.medico_id = $${++countParamCount}`;
      countParams.push(userId);
    }

    if (status) {
      countQuery += ` AND c.status = $${++countParamCount}`;
      countParams.push(status);
    }

    if (data_inicio) {
      countQuery += ` AND c.data_hora >= $${++countParamCount}`;
      countParams.push(data_inicio);
    }

    if (data_fim) {
      countQuery += ` AND c.data_hora <= $${++countParamCount}`;
      countParams.push(data_fim);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const consultas = result.rows.map(row => ({
      id: row.id,
      data_hora: row.data_hora,
      status: row.status,
      especialidade: row.especialidade,
      observacoes: row.observacoes,
      link_video: row.link_video,
      valor: row.valor,
      criado_em: row.criado_em,
      paciente: {
        id: row.paciente_id,
        nome: row.paciente_nome,
        email: row.paciente_email,
        telefone: row.paciente_telefone
      },
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        email: row.medico_email
      }
    }));

    res.json({
      success: true,
      consultas,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar consultas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/consultas/:id - Obter detalhes de uma consulta específica
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const consultaId = req.params.id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    const result = await pool.query(
      `SELECT 
        c.id, c.paciente_id, c.medico_id, c.data_hora, 
        c.status, c.especialidade, c.observacoes, c.link_video, c.valor, c.criado_em,
        p.nome as paciente_nome, p.email as paciente_email, p.telefone as paciente_telefone,
        m.nome as medico_nome, m.email as medico_email
      FROM consultas c
      JOIN usuarios p ON c.paciente_id = p.id
      JOIN usuarios m ON c.medico_id = m.id
      WHERE c.id = $1`,
      [consultaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = result.rows[0];

    // Verificar se o usuário tem permissão para ver esta consulta
    if (userType === 'paciente' && consulta.paciente_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (userType === 'medico' && consulta.medico_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      success: true,
      consulta: {
        id: consulta.id,
        data_hora: consulta.data_hora,
        status: consulta.status,
        especialidade: consulta.especialidade,
        observacoes: consulta.observacoes,
        link_video: consulta.link_video,
        valor: consulta.valor,
        criado_em: consulta.criado_em,
        paciente: {
          id: consulta.paciente_id,
          nome: consulta.paciente_nome,
          email: consulta.paciente_email,
          telefone: consulta.paciente_telefone
        },
        medico: {
          id: consulta.medico_id,
          nome: consulta.medico_nome,
          email: consulta.medico_email
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/consultas/:id - Atualizar consulta
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const consultaId = req.params.id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;
    const { status, observacoes, link_video }: AtualizacaoConsulta = req.body;

    // Verificar se a consulta existe
    const consultaResult = await pool.query(
      'SELECT id, paciente_id, medico_id, status FROM consultas WHERE id = $1',
      [consultaId]
    );

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultaResult.rows[0];

    // Verificar permissões
    if (userType === 'paciente' && consulta.paciente_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (userType === 'medico' && consulta.medico_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Validar transições de status
    if (status) {
      const validStatuses = ['agendada', 'confirmada', 'em_andamento', 'finalizada', 'cancelada'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status inválido' });
      }

      // Regras de negócio para mudança de status
      if (consulta.status === 'finalizada' || consulta.status === 'cancelada') {
      return res.status(400).json({ error: 'Não é possível alterar consulta finalizada ou cancelada' });
      }
    }

    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      updates.push(`status = $${++paramCount}`);
      params.push(status);
    }

    if (observacoes !== undefined) {
      updates.push(`observacoes = $${++paramCount}`);
      params.push(observacoes);
    }

    if (link_video !== undefined) {
      updates.push(`link_video = $${++paramCount}`);
      params.push(link_video);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    params.push(consultaId);

    const updateQuery = `
      UPDATE consultas 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING id, paciente_id, medico_id, data_hora, especialidade, status, observacoes, link_video, valor, criado_em
    `;

    const result = await pool.query(updateQuery, params);
    const consultaAtualizada = result.rows[0];

    // Se a consulta foi marcada como concluída, criar registro no histórico médico
    if (status === 'finalizada' && consulta.status !== 'finalizada') {
      try {
        await pool.query(
          `INSERT INTO historico_medico (paciente_id, consulta_id, diagnostico, tratamento, observacoes, criado_em) 
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [
            consulta.paciente_id,
            consultaId,
            'Consulta realizada',
            'Consulta médica concluída',
            observacoes || 'Consulta realizada sem observações específicas'
          ]
        );
        console.log(`✅ Histórico médico criado automaticamente para consulta ${consultaId}`);
      } catch (historicoError) {
        console.error('Erro ao criar histórico médico:', historicoError);
        // Não falha a atualização da consulta se houver erro no histórico
      }
    }

    res.json({
      success: true,
      message: 'Consulta atualizada com sucesso',
      consulta: consultaAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/consultas/:id - Cancelar consulta
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const consultaId = req.params.id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    // Verificar se a consulta existe
    const consultaResult = await pool.query(
      'SELECT id, paciente_id, medico_id, status, data_hora FROM consultas WHERE id = $1',
      [consultaId]
    );

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada' });
    }

    const consulta = consultaResult.rows[0];

    // Verificar permissões
    if (userType === 'paciente' && consulta.paciente_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (userType === 'medico' && consulta.medico_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se a consulta pode ser cancelada
    if (consulta.status === 'finalizada') {
      return res.status(400).json({ error: 'Não é possível cancelar consulta já finalizada' });
    }

    if (consulta.status === 'cancelada') {
      return res.status(400).json({ error: 'Consulta já está cancelada' });
    }

    // Verificar se não é muito próximo do horário (ex: menos de 2 horas)
    const consultaDateTime = new Date(consulta.data_hora);
    const agora = new Date();
    const diffHours = (consultaDateTime.getTime() - agora.getTime()) / (1000 * 60 * 60);

    if (diffHours < 2 && diffHours > 0) {
      return res.status(400).json({ error: 'Não é possível cancelar consulta com menos de 2 horas de antecedência' });
    }

    // Cancelar consulta
    await pool.query(
      'UPDATE consultas SET status = $1 WHERE id = $2',
      ['cancelada', consultaId]
    );

    res.json({
      success: true,
      message: 'Consulta cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/consultas/medicos/disponiveis - Listar médicos disponíveis
router.get('/medicos/disponiveis', authenticateToken, requireRole(['paciente']), async (req: Request, res: Response) => {
  try {
    const { especialidade, data, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        u.id, u.nome, u.email, u.especialidade, u.crm, u.telefone
      FROM usuarios u
      WHERE u.tipo = 'medico' AND u.ativo = true
    `;

    const params: any[] = [];
    let paramCount = 0;

    if (especialidade) {
      query += ` AND u.especialidade ILIKE $${++paramCount}`;
      params.push(`%${especialidade}%`);
    }

    query += ` ORDER BY u.nome`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    res.json({
      success: true,
      medicos: result.rows
    });

  } catch (error) {
    console.error('Erro ao listar médicos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;