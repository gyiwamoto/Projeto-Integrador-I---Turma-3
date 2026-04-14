import type { VercelRequest, VercelResponse } from './http.types';
import { autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';
import {
  formatarDataSaidaBr,
  normalizarDataHoraIsoUtc,
  normalizarDataIso,
  obterTimezoneNegocio,
} from '../api/_lib/date-time';
import { obterBody, responderErroAutenticacao } from './request-utils.service';


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
  procedimentos_agendados: string[] | null;
  duracao_estimada_min: number | null;
  atualizado_em: string;
  criado_em: string;
}

interface ConsultaCriacaoBody {
  paciente_id?: string;
  usuario_id?: string;
  data_consulta?: string;
  status?: string;
  convenio_cnpj?: string;
  convenio_id?: string;
  numero_carteirinha?: string;
  observacoes?: string;
  procedimentos_agendados?: string[];
  duracao_estimada_min?: number;
}

const PROCEDIMENTO_AVALIACAO = '100';
const DURACOES_POR_PROCEDIMENTO: Record<string, number> = {
  '100': 30,
  '110': 30,
  '115': 120,
  '120': 30,
  '130': 30,
  '140': 90,
  '150': 60,
  '160': 30,
  '170': 30,
  '171': 30,
  '180': 60,
};

function validarIntervaloConsulta15Min(dataIso: string): boolean {
  const data = new Date(dataIso);
  if (Number.isNaN(data.getTime())) {
    return false;
  }

  return data.getMinutes() % 15 === 0;
}

function normalizarProcedimentosAgendados(valor: unknown): string[] {
  if (!Array.isArray(valor)) {
    return [PROCEDIMENTO_AVALIACAO];
  }

  const codigos = valor
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item in DURACOES_POR_PROCEDIMENTO);

  if (!codigos.length) {
    return [PROCEDIMENTO_AVALIACAO];
  }

  return Array.from(new Set(codigos));
}

function calcularDuracaoEstimadaMin(codigos: string[]): number {
  const soma = codigos.reduce((total, codigo) => total + (DURACOES_POR_PROCEDIMENTO[codigo] ?? 0), 0);
  if (soma <= 0) {
    return 30;
  }

  return Math.ceil(soma / 15) * 15;
}

function normalizarConsultaSaida(consulta: ConsultaListagem): ConsultaListagem {
  return {
    ...consulta,
    data_consulta: formatarDataSaidaBr(consulta.data_consulta, true),
    atualizado_em: formatarDataSaidaBr(consulta.atualizado_em, true),
    criado_em: formatarDataSaidaBr(consulta.criado_em, true),
  };
}

export async function listarConsultas(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErroAutenticacao(res, error);
  }

  const criterios: string[] = [];
  const valores: Array<string> = [];
  const admin = usuarioAutenticado.tipo_usuario === 'admin';
  const dentista = usuarioAutenticado.tipo_usuario === 'dentista';
  const recepcionista = usuarioAutenticado.tipo_usuario === 'recepcionista';
  const escopo = typeof req.query.escopo === 'string' ? req.query.escopo.trim().toLowerCase() : '';
  const emAtendimento = escopo === 'atendimento';
  const timezoneNegocio = obterTimezoneNegocio();
  const usuarioQuery = typeof req.query.usuario_id === 'string' ? req.query.usuario_id.trim() : '';
  const dataInicioRaw = typeof req.query.data_inicio === 'string' ? req.query.data_inicio.trim() : '';
  const dataFimRaw = typeof req.query.data_fim === 'string' ? req.query.data_fim.trim() : '';
  const dataInicio = dataInicioRaw ? normalizarDataIso(dataInicioRaw) : null;
  const dataFim = dataFimRaw ? normalizarDataIso(dataFimRaw) : null;

  if (dataInicioRaw && !dataInicio) {
    return res.status(400).json({ erro: 'data_inicio invalida. Use formato DD-MM-YYYY.' });
  }

  if (dataFimRaw && !dataFim) {
    return res.status(400).json({ erro: 'data_fim invalida. Use formato DD-MM-YYYY.' });
  }

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

  if (dataInicio) {
    criterios.push(`(c.data_consulta AT TIME ZONE $${valores.length + 1})::date >= $${valores.length + 2}::date`);
    valores.push(timezoneNegocio, dataInicio);
  }

  if (dataFim) {
    criterios.push(`(c.data_consulta AT TIME ZONE $${valores.length + 1})::date <= $${valores.length + 2}::date`);
    valores.push(timezoneNegocio, dataFim);
  }

  if (emAtendimento) {
    criterios.push(`c.status = $${valores.length + 1}`);
    valores.push('agendado');

    criterios.push(
      `(c.data_consulta AT TIME ZONE $${valores.length + 1})::date = (NOW() AT TIME ZONE $${valores.length + 1})::date`,
    );
    valores.push(timezoneNegocio);
  }

  const ordenacao = emAtendimento ? 'ORDER BY c.data_consulta ASC' : 'ORDER BY c.data_consulta DESC';

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
            c.procedimentos_agendados,
            c.duracao_estimada_min,
            c.atualizado_em,
            c.criado_em
       FROM consultas c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
            LEFT JOIN convenios cv ON cv.cnpj = c.convenio_cnpj${criterios.length ? `
      WHERE ${criterios.join(' AND ')}` : ''}
      ${ordenacao}`;

  const resultado = await pool.query<ConsultaListagem>(sql, valores);

  res.setHeader('Cache-Control', 'public, s-maxage=45, stale-while-revalidate=90');

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    consultas: resultado.rows.map(normalizarConsultaSaida),
  });
}

export async function atualizarStatusConsulta(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErroAutenticacao(res, error);
  }

  const consultaId = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  const body = (req.body ?? {}) as Record<string, unknown>;
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  const dataConsulta = typeof body.data_consulta === 'string' ? body.data_consulta.trim() : '';
  const dataConsultaNormalizada = dataConsulta ? normalizarDataHoraIsoUtc(dataConsulta) : null;
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : '';
  const numeroCarteirinha = typeof body.numero_carteirinha === 'string' ? body.numero_carteirinha.trim() : '';
  const convenioCnpj =
    typeof body.convenio_cnpj === 'string'
      ? body.convenio_cnpj.trim()
      : typeof body.convenio_id === 'string'
        ? body.convenio_id.trim()
        : '';
  const procedimentosAgendadosRaw = body.procedimentos_agendados;

  if (!consultaId) {
    return res.status(400).json({ erro: 'Consulta nao informada.' });
  }

  if (!['agendado', 'realizado', 'cancelado'].includes(status)) {
    return res.status(400).json({ erro: 'Status invalido.' });
  }

  if (dataConsulta && !dataConsultaNormalizada) {
    return res.status(400).json({ erro: 'data_consulta invalida. Use formato DD-MM-YYYY HH:MM.' });
  }

  if (dataConsultaNormalizada && !validarIntervaloConsulta15Min(dataConsultaNormalizada)) {
    return res.status(400).json({ erro: 'data_consulta invalida. O intervalo minimo e de 15 minutos.' });
  }

  const deveAtualizarProcedimentos = Array.isArray(procedimentosAgendadosRaw);
  const procedimentosAgendados = deveAtualizarProcedimentos
    ? normalizarProcedimentosAgendados(procedimentosAgendadosRaw)
    : null;
  const duracaoEstimadaMin = procedimentosAgendados
    ? calcularDuracaoEstimadaMin(procedimentosAgendados)
    : null;

  const camposAtualizacao: string[] = ['status = $2', 'atualizado_em = NOW()'];
  const parametros: Array<unknown> = [consultaId, status];
  let indiceParametro = 3;

  if (dataConsultaNormalizada) {
    camposAtualizacao.push(`data_consulta = $${indiceParametro}`);
    parametros.push(dataConsultaNormalizada);
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

  if (procedimentosAgendados && duracaoEstimadaMin) {
    camposAtualizacao.push(`procedimentos_agendados = $${indiceParametro}`);
    parametros.push(procedimentosAgendados);
    indiceParametro += 1;

    camposAtualizacao.push(`duracao_estimada_min = $${indiceParametro}`);
    parametros.push(duracaoEstimadaMin);
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
                procedimentos_agendados,
                duracao_estimada_min,
                atualizado_em,
                criado_em`,
    parametros,
  );

  if (!resultado.rowCount) {
    return res.status(404).json({ erro: 'Consulta nao encontrada.' });
  }

  const consultaAtualizada = resultado.rows[0];
  if (!consultaAtualizada) {
    return res.status(500).json({ erro: 'Erro interno ao atualizar consulta.' });
  }

  return res.status(200).json({
    mensagem: 'Consulta atualizada com sucesso.',
    consulta: normalizarConsultaSaida(consultaAtualizada),
  });
}

export async function criarConsulta(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErroAutenticacao(res, error);
  }

  let body: ConsultaCriacaoBody;

  try {
    body = obterBody<ConsultaCriacaoBody>(req);
  } catch {
    return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
  }

  const pacienteId = typeof body.paciente_id === 'string' ? body.paciente_id.trim() : '';
  const dataConsulta = typeof body.data_consulta === 'string' ? body.data_consulta.trim() : '';
  const dataConsultaNormalizada = normalizarDataHoraIsoUtc(dataConsulta);
  const status =
    typeof body.status === 'string' && body.status.trim()
      ? body.status.trim().toLowerCase()
      : 'agendado';
  const observacoes = typeof body.observacoes === 'string' ? body.observacoes.trim() : null;
  const numeroCarteirinha =
    typeof body.numero_carteirinha === 'string' ? body.numero_carteirinha.trim() : null;
  const convenioCnpj =
    typeof body.convenio_cnpj === 'string'
      ? body.convenio_cnpj.trim()
      : typeof body.convenio_id === 'string'
        ? body.convenio_id.trim()
        : null;
  const procedimentosAgendados = normalizarProcedimentosAgendados(body.procedimentos_agendados);
  const duracaoEstimadaMin = calcularDuracaoEstimadaMin(procedimentosAgendados);

  if (!pacienteId || !dataConsulta) {
    return res.status(400).json({ erro: 'paciente_id e data_consulta sao obrigatorios.' });
  }

  if (!dataConsultaNormalizada) {
    return res.status(400).json({ erro: 'data_consulta invalida. Use formato DD-MM-YYYY HH:MM.' });
  }

  if (!validarIntervaloConsulta15Min(dataConsultaNormalizada)) {
    return res.status(400).json({ erro: 'data_consulta invalida. O intervalo minimo e de 15 minutos.' });
  }

  if (!['agendado', 'realizado', 'cancelado'].includes(status)) {
    return res.status(400).json({ erro: 'Status invalido.' });
  }

  const usuarioIdBody = typeof body.usuario_id === 'string' ? body.usuario_id.trim() : '';
  const usuarioIdConsulta = usuarioIdBody || String(usuarioAutenticado.id);

  try {
    const inserido = await pool.query<ConsultaListagem>(
      `INSERT INTO consultas
        (paciente_id, usuario_id, data_consulta, status, convenio_cnpj, numero_carteirinha, observacoes, procedimentos_agendados, duracao_estimada_min)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id,
                paciente_id,
                (SELECT nome FROM pacientes WHERE id = paciente_id LIMIT 1) AS paciente_nome,
                (SELECT codigo_paciente FROM pacientes WHERE id = paciente_id LIMIT 1) AS codigo_paciente,
                usuario_id,
                (SELECT nome FROM usuarios WHERE id = usuario_id LIMIT 1) AS usuario_nome,
                status,
                data_consulta,
                convenio_cnpj,
                (SELECT nome FROM convenios WHERE cnpj = convenio_cnpj LIMIT 1) AS convenio_nome,
                numero_carteirinha,
                observacoes,
                procedimentos_agendados,
                duracao_estimada_min,
                atualizado_em,
                criado_em`,
      [
        pacienteId,
        usuarioIdConsulta,
        dataConsultaNormalizada,
        status,
        convenioCnpj || null,
        numeroCarteirinha || null,
        observacoes || null,
        procedimentosAgendados,
        duracaoEstimadaMin,
      ],
    );

    const consultaInserida = inserido.rows[0];
    if (!consultaInserida) {
      return res.status(500).json({ erro: 'Erro interno ao criar consulta.' });
    }

    const consulta = normalizarConsultaSaida(consultaInserida);

    return res.status(201).json({
      mensagem: 'Consulta criada com sucesso.',
      consulta,
    });
  } catch (error) {
    const erro = error as { code?: string; constraint?: string };

    if (erro.code === '23503') {
      if (erro.constraint === 'fk_consultas_pacientes') {
        return res.status(400).json({ erro: 'Paciente informado nao existe.' });
      }

      if (erro.constraint === 'fk_consultas_usuarios') {
        return res.status(400).json({ erro: 'Profissional informado nao existe.' });
      }

      if (erro.constraint === 'fk_consultas_convenios') {
        return res.status(400).json({ erro: 'Convenio informado nao existe.' });
      }
    }

    return res.status(500).json({ erro: 'Erro interno ao criar consulta.' });
  }
}

export async function excluirConsulta(req: VercelRequest, res: VercelResponse) {
  let usuarioAutenticado;

  try {
    usuarioAutenticado = await autenticarRequisicao(req);
  } catch (error) {
    return responderErroAutenticacao(res, error);
  }

  const consultaId = typeof req.query.id === 'string' ? req.query.id.trim() : '';

  if (!consultaId) {
    return res.status(400).json({ erro: 'Consulta nao informada.' });
  }

  const admin = usuarioAutenticado.tipo_usuario === 'admin';
  const resultado = await pool.query(
    `DELETE FROM consultas
      WHERE id = $1${admin ? '' : ' AND usuario_id = $2'}`,
    admin ? [consultaId] : [consultaId, usuarioAutenticado.id],
  );

  if (!resultado.rowCount) {
    return res.status(404).json({ erro: 'Consulta nao encontrada.' });
  }

  return res.status(200).json({ mensagem: 'Consulta excluida com sucesso.' });
}
