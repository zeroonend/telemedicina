import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Interface para histórico médico
interface HistoricoMedico {
  id: string;
  paciente_id: string;
  consulta_id?: string;
  medico_id?: string;
  diagnostico?: string;
  tratamento?: string;
  exames?: string;
  observacoes?: string;
  medicamentos?: any[];
  arquivos_anexos?: string[];
  criado_em: Date;
  atualizado_em?: Date;
}

// GET /api/historico-medico/paciente/:id - Buscar histórico médico de um paciente
router.get('/paciente/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id: pacienteId } = req.params;
    const { page = 1, limit = 10, data_inicio, data_fim } = req.query;
    
    // Verificar se o usuário tem permissão para acessar este histórico
    const userType = (req as any).user.tipo;
    const userId = (req as any).user.id;
    
    if (userType === 'paciente' && userId !== pacienteId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    let whereClause = 'WHERE h.paciente_id = $1';
    const queryParams: any[] = [pacienteId];
    let paramCount = 1;
    
    // Filtros de data
    if (data_inicio) {
      paramCount++;
      whereClause += ` AND h.criado_em >= $${paramCount}`;
      queryParams.push(data_inicio);
    }
    
    if (data_fim) {
      paramCount++;
      whereClause += ` AND h.criado_em <= $${paramCount}`;
      queryParams.push(data_fim);
    }
    
    // Calcular offset para paginação
    const offset = (Number(page) - 1) * Number(limit);
    
    const query = `
      SELECT 
        h.id,
        h.paciente_id,
        h.consulta_id,
        h.diagnostico,
        h.tratamento,
        h.exames,
        h.observacoes,
        h.medicamentos,
        h.arquivos_anexos,
        h.criado_em,
        h.atualizado_em,
        p.nome as paciente_nome,
        p.email as paciente_email,
        m.nome as medico_nome,
        m.especialidade as medico_especialidade,
        c.data_hora as consulta_data
      FROM historico_medico h
      LEFT JOIN usuarios p ON h.paciente_id = p.id
      LEFT JOIN consultas c ON h.consulta_id = c.id
      LEFT JOIN usuarios m ON c.medico_id = m.id
      ${whereClause}
      ORDER BY h.criado_em DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;
    
    queryParams.push(Number(limit), offset);
    
    const result = await pool.query(query, queryParams);
    
    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM historico_medico h
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, queryParams.slice(0, paramCount));
    const total = parseInt(countResult.rows[0].total);
    
    const historico = result.rows.map(row => ({
      id: row.id,
      paciente: {
        id: row.paciente_id,
        nome: row.paciente_nome,
        email: row.paciente_email
      },
      consulta: row.consulta_id ? {
        id: row.consulta_id,
        data: row.consulta_data,
        medico: {
          nome: row.medico_nome,
          especialidade: row.medico_especialidade
        }
      } : null,
      diagnostico: row.diagnostico,
      tratamento: row.tratamento,
      exames: row.exames,
      observacoes: row.observacoes,
      medicamentos: row.medicamentos || [],
      arquivos_anexos: row.arquivos_anexos || [],
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em
    }));
    
    res.json({
      success: true,
      data: historico,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
    
  } catch (error) {
    console.error('Erro ao buscar histórico médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/historico-medico - Criar novo registro no histórico médico
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      paciente_id,
      consulta_id,
      diagnostico,
      tratamento,
      exames,
      observacoes,
      medicamentos,
      arquivos_anexos
    } = req.body;
    
    // Verificar se o usuário é médico
    const userType = (req as any).user.tipo;
    if (userType !== 'medico') {
      return res.status(403).json({ error: 'Apenas médicos podem criar registros no histórico' });
    }
    
    // Validações básicas
    if (!paciente_id) {
      return res.status(400).json({ error: 'ID do paciente é obrigatório' });
    }
    
    if (!diagnostico && !tratamento && !exames && !observacoes) {
      return res.status(400).json({ error: 'Pelo menos um campo de conteúdo deve ser preenchido' });
    }
    
    // Verificar se o paciente existe
    const pacienteCheck = await pool.query(
      'SELECT id FROM usuarios WHERE id = $1 AND tipo = $2 AND ativo = true',
      [paciente_id, 'paciente']
    );
    
    if (pacienteCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Paciente não encontrado' });
    }
    
    // Inserir novo registro
    const insertQuery = `
      INSERT INTO historico_medico (
        paciente_id, consulta_id, diagnostico, tratamento, 
        exames, observacoes, medicamentos, arquivos_anexos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const result = await pool.query(insertQuery, [
      paciente_id,
      consulta_id || null,
      diagnostico || null,
      tratamento || null,
      exames || null,
      observacoes || null,
      JSON.stringify(medicamentos || []),
      arquivos_anexos || []
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Registro criado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao criar registro no histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/historico-medico/:id - Atualizar registro do histórico médico
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      diagnostico,
      tratamento,
      exames,
      observacoes,
      medicamentos,
      arquivos_anexos
    } = req.body;
    
    // Verificar se o usuário é médico
    const userType = (req as any).user.tipo;
    if (userType !== 'medico') {
      return res.status(403).json({ error: 'Apenas médicos podem atualizar registros do histórico' });
    }
    
    // Verificar se o registro existe
    const existingRecord = await pool.query(
      'SELECT * FROM historico_medico WHERE id = $1',
      [id]
    );
    
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    // Atualizar registro
    const updateQuery = `
      UPDATE historico_medico 
      SET 
        diagnostico = COALESCE($1, diagnostico),
        tratamento = COALESCE($2, tratamento),
        exames = COALESCE($3, exames),
        observacoes = COALESCE($4, observacoes),
        medicamentos = COALESCE($5, medicamentos),
        arquivos_anexos = COALESCE($6, arquivos_anexos),
        atualizado_em = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [
      diagnostico,
      tratamento,
      exames,
      observacoes,
      medicamentos ? JSON.stringify(medicamentos) : null,
      arquivos_anexos,
      id
    ]);
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Registro atualizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao atualizar registro do histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/historico-medico/:id - Excluir registro do histórico médico
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário é médico ou admin
    const userType = (req as any).user.tipo;
    if (userType !== 'medico' && userType !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    // Verificar se o registro existe
    const existingRecord = await pool.query(
      'SELECT * FROM historico_medico WHERE id = $1',
      [id]
    );
    
    if (existingRecord.rows.length === 0) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    // Excluir registro
    await pool.query('DELETE FROM historico_medico WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Registro excluído com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao excluir registro do histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;