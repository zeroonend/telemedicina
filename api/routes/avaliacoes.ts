import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Interface para dados de avaliação
interface AvaliacaoData {
  consulta_id: number;
  nota: number;
  comentario?: string;
}

// POST /api/avaliacoes - Criar nova avaliação (Paciente)
router.post('/', authenticateToken, requireRole(['paciente']), async (req: Request, res: Response) => {
  try {
    const { consulta_id, nota, comentario }: AvaliacaoData = req.body;
    const paciente_id = req.user!.id;

    // Validações básicas
    if (!consulta_id || nota === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios: consulta_id, nota' });
    }

    if (nota < 1 || nota > 5) {
      return res.status(400).json({ error: 'Nota deve ser entre 1 e 5' });
    }

    // Verificar se a consulta existe e pertence ao paciente
    const consultaResult = await pool.query(
      `SELECT c.id, c.medico_id, c.status, c.data_consulta, c.horario, m.nome as medico_nome 
       FROM consultas c 
       JOIN usuarios m ON c.medico_id = m.id 
       WHERE c.id = $1 AND c.paciente_id = $2`,
      [consulta_id, paciente_id]
    );

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada ou não pertence a este paciente' });
    }

    const consulta = consultaResult.rows[0];

    // Verificar se a consulta foi realizada
    if (consulta.status !== 'realizada') {
      return res.status(400).json({ 
        error: 'Avaliações só podem ser feitas para consultas realizadas' 
      });
    }

    // Verificar se já existe avaliação para esta consulta
    const avaliacaoExistente = await pool.query(
      'SELECT id FROM avaliacoes WHERE consulta_id = $1',
      [consulta_id]
    );

    if (avaliacaoExistente.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe uma avaliação para esta consulta' });
    }

    // Inserir avaliação no banco
    const result = await pool.query(
      `INSERT INTO avaliacoes (consulta_id, paciente_id, medico_id, nota, comentario) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, consulta_id, paciente_id, medico_id, nota, comentario, criado_em`,
      [consulta_id, paciente_id, consulta.medico_id, nota, comentario || null]
    );

    const novaAvaliacao = result.rows[0];

    // Atualizar média de avaliações do médico
    await atualizarMediaMedico(consulta.medico_id);

    res.status(201).json({
      success: true,
      message: 'Avaliação criada com sucesso',
      avaliacao: {
        ...novaAvaliacao,
        consulta: {
          data_consulta: consulta.data_consulta,
          horario: consulta.horario,
          medico_nome: consulta.medico_nome
        }
      }
    });

  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/avaliacoes - Listar avaliações
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userType = req.user!.tipo;
    const { medico_id, nota_min, nota_max, data_inicio, data_fim, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        a.id, a.consulta_id, a.paciente_id, a.medico_id, a.nota, a.comentario, a.criado_em,
        pac.nome as paciente_nome,
        med.nome as medico_nome, med.especialidade,
        c.data_consulta, c.horario
      FROM avaliacoes a
      JOIN usuarios pac ON a.paciente_id = pac.id
      JOIN usuarios med ON a.medico_id = med.id
      JOIN consultas c ON a.consulta_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtrar por usuário
    if (userType === 'paciente') {
      query += ` AND a.paciente_id = $${++paramCount}`;
      params.push(userId);
    } else if (userType === 'medico') {
      query += ` AND a.medico_id = $${++paramCount}`;
      params.push(userId);
    }

    // Filtros opcionais
    if (medico_id && userType !== 'medico') {
      query += ` AND a.medico_id = $${++paramCount}`;
      params.push(medico_id);
    }

    if (nota_min) {
      query += ` AND a.nota >= $${++paramCount}`;
      params.push(Number(nota_min));
    }

    if (nota_max) {
      query += ` AND a.nota <= $${++paramCount}`;
      params.push(Number(nota_max));
    }

    if (data_inicio) {
      query += ` AND DATE(a.criado_em) >= $${++paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND DATE(a.criado_em) <= $${++paramCount}`;
      params.push(data_fim);
    }

    // Ordenação e paginação
    query += ` ORDER BY a.criado_em DESC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Contar total de registros para paginação
    let countQuery = `
      SELECT COUNT(*) as total
      FROM avaliacoes a
      WHERE 1=1
    `;
    
    const countParams: any[] = [];
    let countParamCount = 0;

    if (userType === 'paciente') {
      countQuery += ` AND a.paciente_id = $${++countParamCount}`;
      countParams.push(userId);
    } else if (userType === 'medico') {
      countQuery += ` AND a.medico_id = $${++countParamCount}`;
      countParams.push(userId);
    }

    if (medico_id && userType !== 'medico') {
      countQuery += ` AND a.medico_id = $${++countParamCount}`;
      countParams.push(medico_id);
    }

    if (nota_min) {
      countQuery += ` AND a.nota >= $${++countParamCount}`;
      countParams.push(Number(nota_min));
    }

    if (nota_max) {
      countQuery += ` AND a.nota <= $${++countParamCount}`;
      countParams.push(Number(nota_max));
    }

    if (data_inicio) {
      countQuery += ` AND DATE(a.criado_em) >= $${++countParamCount}`;
      countParams.push(data_inicio);
    }

    if (data_fim) {
      countQuery += ` AND DATE(a.criado_em) <= $${++countParamCount}`;
      countParams.push(data_fim);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      success: true,
      avaliacoes: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar avaliações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/avaliacoes/:id - Obter detalhes de uma avaliação específica
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    let query = `
      SELECT 
        a.id, a.consulta_id, a.paciente_id, a.medico_id, a.nota, a.comentario, a.criado_em,
        pac.nome as paciente_nome, pac.email as paciente_email,
        med.nome as medico_nome, med.especialidade, med.crm,
        c.data_consulta, c.horario, c.status as consulta_status
      FROM avaliacoes a
      JOIN usuarios pac ON a.paciente_id = pac.id
      JOIN usuarios med ON a.medico_id = med.id
      JOIN consultas c ON a.consulta_id = c.id
      WHERE a.id = $1
    `;

    const params = [id];

    // Verificar permissões
    if (userType === 'paciente') {
      query += ` AND a.paciente_id = $2`;
      params.push(userId);
    } else if (userType === 'medico') {
      query += ` AND a.medico_id = $2`;
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const avaliacao = result.rows[0];

    res.json({
      success: true,
      avaliacao
    });

  } catch (error) {
    console.error('Erro ao obter avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/avaliacoes/:id - Atualizar avaliação (Paciente)
router.put('/:id', authenticateToken, requireRole(['paciente']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nota, comentario } = req.body;
    const paciente_id = req.user!.id;

    if (nota !== undefined && (nota < 1 || nota > 5)) {
      return res.status(400).json({ error: 'Nota deve ser entre 1 e 5' });
    }

    // Verificar se a avaliação existe e pertence ao paciente
    const avaliacaoResult = await pool.query(
      'SELECT id, medico_id FROM avaliacoes WHERE id = $1 AND paciente_id = $2',
      [id, paciente_id]
    );

    if (avaliacaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const avaliacao = avaliacaoResult.rows[0];

    // Construir query de atualização dinamicamente
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    if (nota !== undefined) {
      updateFields.push(`nota = $${++paramCount}`);
      updateParams.push(nota);
    }

    if (comentario !== undefined) {
      updateFields.push(`comentario = $${++paramCount}`);
      updateParams.push(comentario);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updateFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
    updateParams.push(id);

    const result = await pool.query(
      `UPDATE avaliacoes SET ${updateFields.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      updateParams
    );

    const avaliacaoAtualizada = result.rows[0];

    // Atualizar média de avaliações do médico
    await atualizarMediaMedico(avaliacao.medico_id);

    res.json({
      success: true,
      message: 'Avaliação atualizada com sucesso',
      avaliacao: avaliacaoAtualizada
    });

  } catch (error) {
    console.error('Erro ao atualizar avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/avaliacoes/:id - Excluir avaliação (Paciente ou Admin)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    let query = 'SELECT id, medico_id FROM avaliacoes WHERE id = $1';
    const params = [id];

    // Verificar permissões
    if (userType === 'paciente') {
      query += ' AND paciente_id = $2';
      params.push(userId);
    } else if (userType !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const avaliacaoResult = await pool.query(query, params);

    if (avaliacaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    const avaliacao = avaliacaoResult.rows[0];

    // Excluir avaliação
    await pool.query('DELETE FROM avaliacoes WHERE id = $1', [id]);

    // Atualizar média de avaliações do médico
    await atualizarMediaMedico(avaliacao.medico_id);

    res.json({
      success: true,
      message: 'Avaliação excluída com sucesso'
    });

  } catch (error) {
    console.error('Erro ao excluir avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/avaliacoes/medico/:medico_id/estatisticas - Obter estatísticas de avaliações de um médico
router.get('/medico/:medico_id/estatisticas', async (req: Request, res: Response) => {
  try {
    const { medico_id } = req.params;

    // Verificar se o médico existe
    const medicoResult = await pool.query(
      'SELECT id, nome, especialidade FROM usuarios WHERE id = $1 AND tipo = $2',
      [medico_id, 'medico']
    );

    if (medicoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    const medico = medicoResult.rows[0];

    // Obter estatísticas de avaliações
    const estatisticasResult = await pool.query(
      `SELECT 
        COUNT(*) as total_avaliacoes,
        AVG(nota) as media_geral,
        COUNT(CASE WHEN nota = 5 THEN 1 END) as nota_5,
        COUNT(CASE WHEN nota = 4 THEN 1 END) as nota_4,
        COUNT(CASE WHEN nota = 3 THEN 1 END) as nota_3,
        COUNT(CASE WHEN nota = 2 THEN 1 END) as nota_2,
        COUNT(CASE WHEN nota = 1 THEN 1 END) as nota_1
      FROM avaliacoes 
      WHERE medico_id = $1`,
      [medico_id]
    );

    const estatisticas = estatisticasResult.rows[0];

    // Obter avaliações recentes com comentários
    const avaliacoesRecentesResult = await pool.query(
      `SELECT 
        a.nota, a.comentario, a.criado_em,
        pac.nome as paciente_nome
      FROM avaliacoes a
      JOIN usuarios pac ON a.paciente_id = pac.id
      WHERE a.medico_id = $1 AND a.comentario IS NOT NULL AND a.comentario != ''
      ORDER BY a.criado_em DESC
      LIMIT 5`,
      [medico_id]
    );

    res.json({
      success: true,
      medico: {
        id: medico.id,
        nome: medico.nome,
        especialidade: medico.especialidade
      },
      estatisticas: {
        total_avaliacoes: parseInt(estatisticas.total_avaliacoes),
        media_geral: parseFloat(Number(estatisticas.media_geral).toFixed(2)),
        distribuicao_notas: {
          nota_5: parseInt(estatisticas.nota_5),
          nota_4: parseInt(estatisticas.nota_4),
          nota_3: parseInt(estatisticas.nota_3),
          nota_2: parseInt(estatisticas.nota_2),
          nota_1: parseInt(estatisticas.nota_1)
        }
      },
      avaliacoes_recentes: avaliacoesRecentesResult.rows
    });

  } catch (error) {
    console.error('Erro ao obter estatísticas de avaliações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Função auxiliar para atualizar média de avaliações do médico
async function atualizarMediaMedico(medico_id: number) {
  try {
    const result = await pool.query(
      'SELECT AVG(nota) as media FROM avaliacoes WHERE medico_id = $1',
      [medico_id]
    );

    const media = result.rows[0].media ? parseFloat(Number(result.rows[0].media).toFixed(2)) : 0;

    await pool.query(
      'UPDATE usuarios SET avaliacao_media = $1 WHERE id = $2',
      [media, medico_id]
    );
  } catch (error) {
    console.error('Erro ao atualizar média do médico:', error);
  }
}

export default router;