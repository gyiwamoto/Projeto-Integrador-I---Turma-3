import type { VercelRequest, VercelResponse } from './http.types';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';
import { registrarLogAcesso } from './logsAcessos.service';

interface ProcedimentoRealizadoListagem {
  id: string;
  consulta_id: string;
  tratamento_id: string;
  tratamento_nome: string | null;
  dente: number | null;
  face: string | null;
  data_procedimento: string;
  observacoes: string | null;
  criado_em: string;
}

interface ConsultaAutorizacao {
  id: string;
  usuario_id: string;
}

interface ProcedimentoAtualizacaoPayload {
  tratamento_id: string;
  dente: number;
  face: string;
  data_procedimento: string;
  observacoes: string | null;
}

function responderErro(res: VercelResponse, error: unknown): VercelResponse {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  return res.status(401).json({ erro: 'Requer autenticacao.' });
}

export async function listarProcedimentosRealizados(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErro(res, error);
  }

  const consultaId = typeof req.query.consulta_id === 'string' ? req.query.consulta_id.trim() : '';

  const criterios: string[] = [];
  const parametros: Array<string> = [];

  if (consultaId) {
    criterios.push(`pr.consulta_id = $${parametros.length + 1}`);
    parametros.push(consultaId);
  }

  if (usuarioAutenticado.tipo_usuario !== 'admin') {
    criterios.push(`c.usuario_id = $${parametros.length + 1}`);
    parametros.push(usuarioAutenticado.id);
  }

  const resultado = await pool.query<ProcedimentoRealizadoListagem>(
    `SELECT pr.id,
            pr.consulta_id,
            pr.tratamento_id,
            t.nome AS tratamento_nome,
            pr.dente,
            pr.face,
            pr.data_procedimento,
            pr.observacoes,
            pr.criado_em
       FROM procedimentos_realizados pr
       LEFT JOIN tratamentos t ON t.id = pr.tratamento_id
       LEFT JOIN consultas c ON c.id = pr.consulta_id${criterios.length ? `
      WHERE ${criterios.join(' AND ')}` : ''}
      ORDER BY pr.data_procedimento DESC`,
    parametros,
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    procedimentos_realizados: resultado.rows,
  });
}

export async function criarProcedimentoRealizado(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErro(res, error);
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const consultaId = typeof body.consulta_id === 'string' ? body.consulta_id.trim() : '';
  const tratamentoId = typeof body.tratamento_id === 'string' ? body.tratamento_id.trim() : '';
  const dente = Number(body.dente);
  const face = typeof body.face === 'string' ? body.face.trim().toUpperCase() : '';
  const dataProcedimento = typeof body.data_procedimento === 'string' ? body.data_procedimento.trim() : '';
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : null;

  if (!consultaId || !tratamentoId || !Number.isInteger(dente) || !dataProcedimento) {
    return res.status(400).json({ erro: 'Dados obrigatorios ausentes.' });
  }

  if (dente < 11 || dente > 48) {
    return res.status(400).json({ erro: 'Dente invalido.' });
  }

  if (!['V', 'P', 'M', 'D', 'L', 'O', 'I'].includes(face)) {
    return res.status(400).json({ erro: 'Face invalida.' });
  }

  const consultaAutorizacao = await pool.query<ConsultaAutorizacao>(
    usuarioAutenticado.tipo_usuario === 'admin'
      ? 'SELECT id, usuario_id FROM consultas WHERE id = $1 LIMIT 1'
      : 'SELECT id, usuario_id FROM consultas WHERE id = $1 AND usuario_id = $2 LIMIT 1',
    usuarioAutenticado.tipo_usuario === 'admin' ? [consultaId] : [consultaId, usuarioAutenticado.id],
  );

  if (!consultaAutorizacao.rowCount) {
    return res.status(404).json({ erro: 'Consulta nao encontrada.' });
  }

  const inserido = await pool.query<ProcedimentoRealizadoListagem>(
    `INSERT INTO procedimentos_realizados (consulta_id, tratamento_id, dente, face, data_procedimento, observacoes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, consulta_id, tratamento_id, dente, face, data_procedimento, observacoes, criado_em`,
    [consultaId, tratamentoId, dente, face, dataProcedimento, observacoes],
  );

  const procedimento = inserido.rows[0];

  await registrarLogAcesso({
    req,
    usuarioId: usuarioAutenticado.id,
    statusHttp: 201,
    sucesso: true,
    mensagem: 'Procedimento registrado com sucesso.',
    rotaPadrao: '/api/procedimentos-realizados',
  });

  return res.status(201).json({
    mensagem: 'Procedimento registrado com sucesso.',
    procedimento,
  });
}

export async function atualizarProcedimentoRealizado(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErro(res, error);
  }

  const procedimentoId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  const body = (req.body ?? {}) as Record<string, unknown>;
  const tratamentoId = typeof body.tratamento_id === 'string' ? body.tratamento_id.trim() : '';
  const dente = Number(body.dente);
  const face = typeof body.face === 'string' ? body.face.trim().toUpperCase() : '';
  const dataProcedimento = typeof body.data_procedimento === 'string' ? body.data_procedimento.trim() : '';
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : null;

  if (!procedimentoId || !tratamentoId || !Number.isInteger(dente) || !dataProcedimento) {
    return res.status(400).json({ erro: 'Dados obrigatorios ausentes.' });
  }

  if (dente < 11 || dente > 48) {
    return res.status(400).json({ erro: 'Dente invalido.' });
  }

  if (!['V', 'P', 'M', 'D', 'L', 'O', 'I'].includes(face)) {
    return res.status(400).json({ erro: 'Face invalida.' });
  }

  const consultaAutorizacao = await pool.query<ConsultaAutorizacao>(
    `SELECT c.id, c.usuario_id
       FROM procedimentos_realizados pr
       INNER JOIN consultas c ON c.id = pr.consulta_id
      WHERE pr.id = $1${usuarioAutenticado.tipo_usuario === 'admin' ? '' : ' AND c.usuario_id = $2'}
      LIMIT 1`,
    usuarioAutenticado.tipo_usuario === 'admin' ? [procedimentoId] : [procedimentoId, usuarioAutenticado.id],
  );

  if (!consultaAutorizacao.rowCount) {
    return res.status(404).json({ erro: 'Procedimento nao encontrado.' });
  }

  const atualizado = await pool.query<ProcedimentoRealizadoListagem>(
    `UPDATE procedimentos_realizados
        SET tratamento_id = $2,
            dente = $3,
            face = $4,
            data_procedimento = $5,
            observacoes = $6
      WHERE id = $1
      RETURNING id, consulta_id, tratamento_id, dente, face, data_procedimento, observacoes, criado_em`,
    [procedimentoId, tratamentoId, dente, face, dataProcedimento, observacoes],
  );

  const procedimento = atualizado.rows[0];

  await registrarLogAcesso({
    req,
    usuarioId: usuarioAutenticado.id,
    statusHttp: 200,
    sucesso: true,
    mensagem: 'Procedimento atualizado com sucesso.',
    rotaPadrao: '/api/procedimentos-realizados',
  });

  return res.status(200).json({
    mensagem: 'Procedimento atualizado com sucesso.',
    procedimento,
  });
}
