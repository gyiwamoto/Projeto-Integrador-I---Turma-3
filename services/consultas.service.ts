import type { VercelRequest, VercelResponse } from './http.types';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ConsultaListagem {
  id: string;
  paciente_id: string;
  paciente_nome: string | null;
  codigo_paciente: string | null;
  usuario_id: string;
  usuario_nome: string | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  data_consulta: string;
  convenio_cnpj: string | null;
  convenio_nome: string | null;
  numero_carteirinha: string | null;
  observacoes: string | null;
  atualizado_em: string;
  criado_em: string;
}

function responderErro(res: VercelResponse, error: unknown): VercelResponse {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  return res.status(401).json({ erro: 'Requer autenticacao.' });
}

export async function listarConsultas(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErro(res, error);
  }

  const criterios: string[] = [];
  const valores: Array<string> = [];
  const admin = usuarioAutenticado.tipo_usuario === 'admin';
  const dentista = usuarioAutenticado.tipo_usuario === 'dentista';
  const recepcionista = usuarioAutenticado.tipo_usuario === 'recepcionista';
  const escopo = typeof req.query.escopo === 'string' ? req.query.escopo.trim().toLowerCase() : '';
  const emAtendimento = escopo === 'atendimento';
  const usuarioQuery = typeof req.query.usuario_id === 'string' ? req.query.usuario_id.trim() : '';

  if (emAtendimento && recepcionista) {
    return res.status(403).json({
      erro: 'Acesso negado para atendimentos. Apenas admin e dentista vinculado podem visualizar.',
    });
  }

  if (dentista) {
    criterios.push(`c.usuario_id = $${valores.length + 1}`);
    valores.push(String(usuarioAutenticado.id));
  } else if (admin && usuarioQuery) {
    criterios.push(`c.usuario_id = $${valores.length + 1}`);
    valores.push(usuarioQuery);
  }

  const pacienteQuery = typeof req.query.paciente_id === 'string' ? req.query.paciente_id.trim() : '';
  if (pacienteQuery) {
    criterios.push(`c.paciente_id = $${valores.length + 1}`);
    valores.push(pacienteQuery);
  }

  const sql = `SELECT c.id,
            c.paciente_id,
            p.nome AS paciente_nome,
            p.codigo_paciente,
            c.usuario_id,
            u.nome AS usuario_nome,
            c.status,
            c.data_consulta,
            c.convenio_cnpj,
            cv.nome AS convenio_nome,
            c.numero_carteirinha,
            c.observacoes,
            c.atualizado_em,
            c.criado_em
       FROM consultas c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
            LEFT JOIN convenios cv ON cv.cnpj = c.convenio_cnpj${criterios.length ? `
      WHERE ${criterios.join(' AND ')}` : ''}
      ORDER BY c.data_consulta DESC`;

  const resultado = await pool.query<ConsultaListagem>(sql, valores);

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    consultas: resultado.rows,
  });
}

export async function atualizarStatusConsulta(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErro(res, error);
  }

  const consultaId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  const body = (req.body ?? {}) as Record<string, unknown>;
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const dataConsulta = typeof body.data_consulta === 'string' ? body.data_consulta.trim() : '';
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : '';
  const numeroCarteirinha = typeof body.numero_carteirinha === 'string' ? body.numero_carteirinha.trim() : '';
  const convenioCnpj =
    typeof body.convenio_cnpj === 'string'
      ? body.convenio_cnpj.trim()
      : typeof body.convenio_id === 'string'
        ? body.convenio_id.trim()
        : '';

  if (!consultaId) {
    return res.status(400).json({ erro: 'Consulta nao informada.' });
  }

  if (!['agendado', 'realizado', 'cancelado'].includes(status)) {
    return res.status(400).json({ erro: 'Status invalido.' });
  }

  const camposAtualizacao: string[] = ['status = $2', 'atualizado_em = NOW()'];
  const parametros: Array<string> = [consultaId, status];
  let indiceParametro = 3;

  if (dataConsulta) {
    camposAtualizacao.push(`data_consulta = $${indiceParametro}`);
    parametros.push(dataConsulta);
    indiceParametro += 1;
  }

  if (observacoes) {
    camposAtualizacao.push(`observacoes = $${indiceParametro}`);
    parametros.push(observacoes);
    indiceParametro += 1;
  }

  if (numeroCarteirinha) {
    camposAtualizacao.push(`numero_carteirinha = $${indiceParametro}`);
    parametros.push(numeroCarteirinha);
    indiceParametro += 1;
  }

  if (convenioCnpj) {
    camposAtualizacao.push(`convenio_cnpj = $${indiceParametro}`);
    parametros.push(convenioCnpj);
    indiceParametro += 1;
  }

  const criterioUsuario = usuarioAutenticado.tipo_usuario === 'admin' ? '' : ` AND usuario_id = $${indiceParametro}`;
  if (usuarioAutenticado.tipo_usuario !== 'admin') {
    parametros.push(usuarioAutenticado.id);
  }

  const resultado = await pool.query<ConsultaListagem>(
    `UPDATE consultas
        SET ${camposAtualizacao.join(', ')}
      WHERE id = $1${criterioUsuario}
      RETURNING id,
                paciente_id,
                (SELECT codigo_paciente FROM pacientes WHERE id = paciente_id LIMIT 1) AS codigo_paciente,
                usuario_id,
                status,
                data_consulta,
                convenio_cnpj,
                numero_carteirinha,
                observacoes,
                atualizado_em,
                criado_em`,
    parametros,
  );

  if (!resultado.rowCount) {
    return res.status(404).json({ erro: 'Consulta nao encontrada.' });
  }

  return res.status(200).json({
    mensagem: 'Consulta atualizada com sucesso.',
    consulta: resultado.rows[0],
  });
}
