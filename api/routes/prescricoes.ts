import { Router, Request, Response } from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Interface para dados de prescrição
interface PrescricaoData {
  consulta_id: number;
  medicamentos: Array<{
    nome: string;
    dosagem: string;
    frequencia: string;
    duracao: string;
    observacoes?: string;
  }>;
  observacoes_gerais?: string;
}

// Interface para medicamento
interface Medicamento {
  nome: string;
  dosagem: string;
  frequencia: string;
  duracao: string;
  observacoes?: string;
}

// POST /api/prescricoes - Criar nova prescrição (Médico)
router.post('/', authenticateToken, requireRole(['medico']), async (req: Request, res: Response) => {
  try {
    const { consulta_id, medicamentos, orientacoes } = req.body;
    const medico_id = req.user!.id;

    console.log('=== DEBUG PRESCRIÇÕES ===');
    console.log('Dados recebidos completos:', JSON.stringify(req.body, null, 2));
    console.log('Tipo de medicamentos:', typeof medicamentos);
    console.log('É array?', Array.isArray(medicamentos));
    console.log('Medicamentos raw:', medicamentos);

    // Validar dados obrigatórios
    if (!consulta_id || !medicamentos) {
      return res.status(400).json({ error: 'Consulta ID e medicamentos são obrigatórios' });
    }

    // Garantir que medicamentos é um array
    let medicamentosArray;
    if (typeof medicamentos === 'string') {
      try {
        medicamentosArray = JSON.parse(medicamentos);
        console.log('Medicamentos parseados de string:', medicamentosArray);
      } catch (e) {
        return res.status(400).json({ error: 'Formato de medicamentos inválido' });
      }
    } else if (Array.isArray(medicamentos)) {
      medicamentosArray = medicamentos;
      console.log('Medicamentos já são array:', medicamentosArray);
    } else {
      return res.status(400).json({ error: 'Medicamentos deve ser um array' });
    }

    if (!Array.isArray(medicamentosArray) || medicamentosArray.length === 0) {
      return res.status(400).json({ error: 'Medicamentos deve ser um array não vazio' });
    }

    // Validar cada medicamento
    for (const med of medicamentosArray) {
      if (!med.nome || !med.dosagem || !med.frequencia || !med.duracao) {
        return res.status(400).json({ 
          error: 'Cada medicamento deve ter: nome, dosagem, frequência e duração' 
        });
      }
    }

    // Simplificar estrutura dos medicamentos para garantir compatibilidade
    const medicamentosSimples = medicamentosArray.map(med => ({
      nome: String(med.nome),
      dosagem: String(med.dosagem),
      frequencia: String(med.frequencia),
      duracao: String(med.duracao),
      observacoes: String(med.observacoes || '')
    }));

    console.log('Medicamentos processados:', JSON.stringify(medicamentosSimples));

    // Verificar se a consulta existe e pertence ao médico
    const consultaResult = await pool.query(
      `SELECT c.id, c.paciente_id, c.status, p.name as paciente_nome 
         FROM consultas c 
         JOIN users p ON c.paciente_id = p.id 
         WHERE c.id = $1 AND c.medico_id = $2`,
      [consulta_id, medico_id]
    );
    
    // Log para debug
    console.log('Consulta encontrada:', consulta_id, 'Médico:', medico_id);

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada ou não pertence a este médico' });
    }

    const consulta = consultaResult.rows[0];

    // Verificar se a consulta está em status adequado para prescrição
    if (!['em_andamento', 'finalizada'].includes(consulta.status)) {
      return res.status(400).json({ 
        error: 'Prescrições só podem ser criadas para consultas em andamento ou finalizadas' 
      });
    }

    // Verificar se já existe prescrição para esta consulta
    const prescricaoExistente = await pool.query(
      'SELECT id FROM prescricoes WHERE consulta_id = $1',
      [consulta_id]
    );

    if (prescricaoExistente.rows.length > 0) {
      return res.status(409).json({ error: 'Já existe uma prescrição para esta consulta' });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Inserir prescrição - sempre usar os medicamentos processados
      console.log('Medicamentos para inserção:', medicamentosSimples);
      console.log('Tipo dos medicamentos:', typeof medicamentosSimples);
      
      // Criar JSON string e verificar
      const medicamentosJson = JSON.stringify(medicamentosSimples);
      console.log('JSON string criada:', medicamentosJson);
      console.log('Tipo da JSON string:', typeof medicamentosJson);
      console.log('Tamanho da JSON string:', medicamentosJson.length);
      
      const prescricaoResult = await pool.query(
        `INSERT INTO prescricoes (consulta_id, medico_id, medicamentos, orientacoes, assinatura_digital, ativa, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         RETURNING *`,
        [consulta_id, medico_id, medicamentosJson, orientacoes || '', `Dr. ${medico_id}`]
      );

      const novaPrescricao = prescricaoResult.rows[0];

      // Atualizar status da consulta para finalizada se ainda não estiver
      if (consulta.status !== 'finalizada') {
        await pool.query(
          'UPDATE consultas SET status = $1 WHERE id = $2',
          ['finalizada', consulta_id]
        );
      }

      // Integração automática com histórico médico
      // Criar ou atualizar registro no histórico médico com os medicamentos prescritos
      const medicamentosTexto = medicamentosSimples.map(med => 
        `${med.nome} - ${med.dosagem} - ${med.frequencia} - ${med.duracao}${med.observacoes ? ` (${med.observacoes})` : ''}`
      ).join('; ');

      // Verificar se já existe um registro de histórico para esta consulta
      const historicoExistente = await pool.query(
        'SELECT id, medicamentos FROM historico_medico WHERE consulta_id = $1',
        [consulta_id]
      );

      if (historicoExistente.rows.length > 0) {
        // Atualizar registro existente adicionando os novos medicamentos
        const historicoId = historicoExistente.rows[0].id;
        const medicamentosAtuais = historicoExistente.rows[0].medicamentos || [];
        const medicamentosAtualizados = Array.isArray(medicamentosAtuais) ? 
          [...medicamentosAtuais, ...medicamentosSimples] : medicamentosSimples;

        await pool.query(
          'UPDATE historico_medico SET medicamentos = $1 WHERE id = $2',
          [JSON.stringify(medicamentosAtualizados), historicoId]
        );
      } else {
        // Criar novo registro no histórico médico
        await pool.query(
          `INSERT INTO historico_medico (paciente_id, consulta_id, medicamentos, observacoes, criado_em) 
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            consulta.paciente_id,
            consulta_id,
            JSON.stringify(medicamentosSimples), // Converter para string JSON
            orientacoes || 'Prescrição médica criada automaticamente'
          ]
        );
        }

      await pool.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Prescrição criada com sucesso',
        prescricao: {
          id: novaPrescricao.id,
          consulta_id: novaPrescricao.consulta_id,
          medicamentos: novaPrescricao.medicamentos, // PostgreSQL já retorna como objeto
          orientacoes: novaPrescricao.orientacoes,
          ativa: novaPrescricao.ativa,
          criado_em: novaPrescricao.criado_em,
          paciente: {
            id: consulta.paciente_id,
            nome: consulta.paciente_nome
          },
          medico: {
            id: medico_id
          }
        }
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Erro ao criar prescrição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/prescricoes - Listar prescrições do usuário
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userType = req.user!.tipo;
    const { status, data_inicio, data_fim, page = 1, limit = 10 } = req.query;

    let query = `
      SELECT 
        p.id, p.consulta_id, p.medico_id, c.paciente_id, p.medicamentos, 
        p.orientacoes as observacoes_gerais, p.ativa as status, p.criado_em, p.criado_em as atualizado_em,
        pac.nome as paciente_nome, pac.email as paciente_email,
        med.nome as medico_nome, med.tipo as especialidade, '' as crm,
        c.data_hora as data_consulta, '' as horario
      FROM prescricoes p
      JOIN consultas c ON p.consulta_id = c.id
      JOIN usuarios pac ON c.paciente_id = pac.id
      JOIN usuarios med ON p.medico_id = med.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 0;

    // Filtrar por usuário (paciente ou médico)
    if (userType === 'paciente') {
      query += ` AND c.paciente_id = $${++paramCount}`;
      params.push(userId);
    } else if (userType === 'medico') {
      query += ` AND p.medico_id = $${++paramCount}`;
      params.push(userId);
    }

    // Filtros opcionais
    if (status) {
      query += ` AND p.status = $${++paramCount}`;
      params.push(status);
    }

    if (data_inicio) {
      query += ` AND p.criado_em >= $${++paramCount}`;
      params.push(data_inicio);
    }

    if (data_fim) {
      query += ` AND p.criado_em <= $${++paramCount}`;
      params.push(data_fim);
    }

    // Ordenação e paginação
    query += ` ORDER BY p.criado_em DESC`;
    
    const offset = (Number(page) - 1) * Number(limit);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(Number(limit), offset);

    const result = await pool.query(query, params);

    // Contar total de registros
    let countQuery = `
      SELECT COUNT(*) as total
      FROM prescricoes p
      WHERE 1=1
    `;
    const countParams: any[] = [];
    let countParamCount = 0;

    if (userType === 'paciente') {
      countQuery += ` AND p.consulta_id IN (SELECT id FROM consultas WHERE paciente_id = $${++countParamCount})`;
      countParams.push(userId);
    } else if (userType === 'medico') {
      countQuery += ` AND p.medico_id = $${++countParamCount}`;
      countParams.push(userId);
    }

    if (status) {
      countQuery += ` AND p.status = $${++countParamCount}`;
      countParams.push(status);
    }

    if (data_inicio) {
      countQuery += ` AND p.criado_em >= $${++countParamCount}`;
      countParams.push(data_inicio);
    }

    if (data_fim) {
      countQuery += ` AND p.criado_em <= $${++countParamCount}`;
      countParams.push(data_fim);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const prescricoes = result.rows.map(row => ({
      id: row.id,
      consulta_id: row.consulta_id,
      medicamentos: row.medicamentos, // PostgreSQL já retorna como objeto
      observacoes_gerais: row.observacoes_gerais,
      status: row.status,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
      paciente: {
        id: row.paciente_id,
        nome: row.paciente_nome,
        email: row.paciente_email
      },
      medico: {
        id: row.medico_id,
        nome: row.medico_nome,
        especialidade: row.especialidade,
        crm: row.crm
      },
      consulta: {
        data_consulta: row.data_consulta,
        horario: row.horario
      }
    }));

    res.json({
      success: true,
      prescricoes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao listar prescrições:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/prescricoes/:id - Obter detalhes de uma prescrição específica
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const prescricaoId = req.params.id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    const result = await pool.query(
      `SELECT 
        p.id, p.consulta_id, p.medico_id, c.paciente_id, p.medicamentos, 
        p.orientacoes as observacoes_gerais, p.ativa as status, p.criado_em, p.criado_em as atualizado_em,
        pac.nome as paciente_nome, pac.email as paciente_email, pac.telefone as paciente_telefone, '' as cpf,
        med.nome as medico_nome, med.email as medico_email, med.tipo as especialidade, '' as crm,
        c.data_hora as data_consulta, '' as horario, c.especialidade as consulta_tipo
      FROM prescricoes p
      JOIN consultas c ON p.consulta_id = c.id
      JOIN usuarios pac ON c.paciente_id = pac.id
      JOIN usuarios med ON p.medico_id = med.id
      WHERE p.id = $1`,
      [prescricaoId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescrição não encontrada' });
    }

    const prescricao = result.rows[0];

    // Verificar se o usuário tem permissão para ver esta prescrição
    if (userType === 'paciente' && prescricao.paciente_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (userType === 'medico' && prescricao.medico_id !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json({
      success: true,
      prescricao: {
        id: prescricao.id,
        consulta_id: prescricao.consulta_id,
        medicamentos: prescricao.medicamentos, // PostgreSQL já retorna como objeto
        observacoes_gerais: prescricao.observacoes_gerais,
        status: prescricao.status,
        criado_em: prescricao.criado_em,
        atualizado_em: prescricao.atualizado_em,
        paciente: {
          id: prescricao.paciente_id,
          nome: prescricao.paciente_nome,
          email: prescricao.paciente_email,
          telefone: prescricao.paciente_telefone,
          cpf: prescricao.cpf
        },
        medico: {
          id: prescricao.medico_id,
          nome: prescricao.medico_nome,
          email: prescricao.medico_email,
          especialidade: prescricao.especialidade,
          crm: prescricao.crm
        },
        consulta: {
          data_consulta: prescricao.data_consulta,
          horario: prescricao.horario,
          tipo: prescricao.consulta_tipo
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter prescrição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/prescricoes/:id - Atualizar prescrição (Médico)
router.put('/:id', authenticateToken, requireRole(['medico']), async (req: Request, res: Response) => {
  try {
    const prescricaoId = req.params.id;
    const medico_id = req.user!.id;
    const { medicamentos, observacoes_gerais, status } = req.body;

    // Verificar se a prescrição existe e pertence ao médico
    const prescricaoResult = await pool.query(
      'SELECT id, medico_id, status FROM prescricoes WHERE id = $1',
      [prescricaoId]
    );

    if (prescricaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prescrição não encontrada' });
    }

    const prescricao = prescricaoResult.rows[0];

    if (prescricao.medico_id !== medico_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Verificar se a prescrição pode ser editada
    if (prescricao.status === 'cancelada') {
      return res.status(400).json({ error: 'Não é possível editar prescrição cancelada' });
    }

    // Validar medicamentos se fornecidos
    if (medicamentos) {
      if (!Array.isArray(medicamentos) || medicamentos.length === 0) {
        return res.status(400).json({ error: 'Lista de medicamentos deve ser um array não vazio' });
      }

      for (const med of medicamentos) {
        if (!med.nome || !med.dosagem || !med.frequencia || !med.duracao) {
          return res.status(400).json({ 
            error: 'Cada medicamento deve ter: nome, dosagem, frequência e duração' 
          });
        }
      }
    }

    // Validar status se fornecido
    if (status && !['ativa', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status deve ser "ativa" ou "cancelada"' });
    }

    // Construir query de atualização dinamicamente
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (medicamentos) {
      updates.push(`medicamentos = $${++paramCount}`);
      params.push(JSON.stringify(medicamentos));
    }

    if (observacoes_gerais !== undefined) {
      updates.push(`observacoes_gerais = $${++paramCount}`);
      params.push(observacoes_gerais);
    }

    if (status) {
      updates.push(`status = $${++paramCount}`);
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    updates.push(`atualizado_em = CURRENT_TIMESTAMP`);
    params.push(prescricaoId);

    const updateQuery = `
      UPDATE prescricoes 
      SET ${updates.join(', ')}
      WHERE id = $${++paramCount}
      RETURNING id, consulta_id, medico_id, paciente_id, medicamentos, observacoes_gerais, status, atualizado_em
    `;

    const result = await pool.query(updateQuery, params);
    const prescricaoAtualizada = result.rows[0];

    res.json({
      success: true,
      message: 'Prescrição atualizada com sucesso',
      prescricao: {
        ...prescricaoAtualizada,
        medicamentos: prescricaoAtualizada.medicamentos // PostgreSQL já retorna como objeto
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar prescrição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/prescricoes/:id - Cancelar prescrição (Médico)
router.delete('/:id', authenticateToken, requireRole(['medico']), async (req: Request, res: Response) => {
  try {
    const prescricaoId = req.params.id;
    const medico_id = req.user!.id;

    // Verificar se a prescrição existe e pertence ao médico
    const prescricaoResult = await pool.query(
      'SELECT id, medico_id, status FROM prescricoes WHERE id = $1',
      [prescricaoId]
    );

    if (prescricaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Prescrição não encontrada' });
    }

    const prescricao = prescricaoResult.rows[0];

    if (prescricao.medico_id !== medico_id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (prescricao.status === 'cancelada') {
      return res.status(400).json({ error: 'Prescrição já está cancelada' });
    }

    // Cancelar prescrição
    await pool.query(
      'UPDATE prescricoes SET status = $1, atualizado_em = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelada', prescricaoId]
    );

    res.json({
      success: true,
      message: 'Prescrição cancelada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao cancelar prescrição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/prescricoes/consulta/:consulta_id - Obter prescrição por consulta
router.get('/consulta/:consulta_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const consultaId = req.params.consulta_id;
    const userId = req.user!.id;
    const userType = req.user!.tipo;

    // Primeiro verificar se o usuário tem acesso à consulta
    let consultaQuery = 'SELECT id, paciente_id, medico_id FROM consultas WHERE id = $1';
    if (userType === 'paciente') {
      consultaQuery += ' AND paciente_id = $2';
    } else if (userType === 'medico') {
      consultaQuery += ' AND medico_id = $2';
    }

    const consultaResult = await pool.query(consultaQuery, [consultaId, userId]);

    if (consultaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Consulta não encontrada ou acesso negado' });
    }

    // Buscar prescrição da consulta
    const result = await pool.query(
      `SELECT 
        p.id, p.consulta_id, p.medico_id, p.paciente_id, p.medicamentos, 
        p.observacoes_gerais, p.status, p.criado_em, p.atualizado_em,
        med.name as medico_nome, med.user_type as especialidade, '' as crm
       FROM prescricoes p
       JOIN users med ON p.medico_id = med.id
      WHERE p.consulta_id = $1`,
      [consultaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhuma prescrição encontrada para esta consulta' });
    }

    const prescricao = result.rows[0];

    res.json({
      success: true,
      prescricao: {
        id: prescricao.id,
        consulta_id: prescricao.consulta_id,
        medicamentos: prescricao.medicamentos, // PostgreSQL já retorna como objeto
        observacoes_gerais: prescricao.observacoes_gerais,
        status: prescricao.status,
        criado_em: prescricao.criado_em,
        atualizado_em: prescricao.atualizado_em,
        medico: {
          id: prescricao.medico_id,
          nome: prescricao.medico_nome,
          especialidade: prescricao.especialidade,
          crm: prescricao.crm
        }
      }
    });

  } catch (error) {
    console.error('Erro ao obter prescrição da consulta:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;