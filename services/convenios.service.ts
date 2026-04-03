import type { VercelRequest, VercelResponse } from './http.types';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ConvenioListagem {
  id: string;
  nome: string;
  ativo: boolean;
  atualizado_em: string;
  criado_em: string;
}

interface ConvenioBody {
  nome?: string;
  ativo?: boolean;
}

function extrairIdDaUrl(req: VercelRequest): string {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  return id;
}

function obterBody(req: VercelRequest): ConvenioBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as ConvenioBody;
  if (typeof req.body === 'object') return req.body as ConvenioBody;
  return {};
}

export async function listarConvenios(req: VercelRequest, res: VercelResponse) {
  try {
    await autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<ConvenioListagem>(
    'SELECT id, nome, ativo, atualizado_em FROM convenios ORDER BY nome ASC',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    convenios: resultado.rows,
  });
}

export async function criarConvenio(req: VercelRequest, res: VercelResponse) {
  try {
    const usuario = await autenticarRequisicao(req);
    verificarAdminAutorizado(usuario);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = obterBody(req);

    if (typeof body.nome !== 'string' || !body.nome.trim()) {
      return res.status(400).json({ erro: 'Nome do convenio eh obrigatorio.' });
    }

    const nome = body.nome.trim();
    const ativo = body.ativo ?? true;

    const resultado = await pool.query<ConvenioListagem>(
      `INSERT INTO convenios (nome, ativo)
       VALUES ($1, $2)
       RETURNING id, nome, ativo, criado_em, atualizado_em`,
      [nome, ativo],
    );

    if (resultado.rowCount !== 1) {
      return res.status(500).json({ erro: 'Erro ao criar convenio.' });
    }

    return res.status(201).json({
      mensagem: 'Convenio criado com sucesso.',
      convenio: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof Error && error.message.includes('unique constraint')) {
      return res.status(409).json({ erro: 'Convenio ja cadastrado.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao criar convenio.' });
  }
}

export async function editarConvenio(req: VercelRequest, res: VercelResponse) {
  let id: string;

  try {
    id = extrairIdDaUrl(req);
    const usuario = await autenticarRequisicao(req);
    verificarAdminAutorizado(usuario);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = obterBody(req);
    const campos: { chave: string; valor: unknown }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }

      campos.push({ chave: 'nome', valor: body.nome.trim() });
    }

    if (body.ativo !== undefined) {
      campos.push({ chave: 'ativo', valor: Boolean(body.ativo) });
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    campos.push({ chave: 'atualizado_em', valor: new Date().toISOString() });

    const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
    const valores = campos.map((campo) => campo.valor);

    const resultado = await pool.query<ConvenioListagem>(
      `UPDATE convenios
          SET ${setClauses}
        WHERE id = $${campos.length + 1}
      RETURNING id, nome, ativo, criado_em, atualizado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Convenio nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Convenio atualizado com sucesso.',
      convenio: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof Error && error.message.includes('unique constraint')) {
      return res.status(409).json({ erro: 'Convenio ja cadastrado.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar convenio.' });
  }
}

export async function deletarConvenio(req: VercelRequest, res: VercelResponse) {
  let id: string;

  try {
    id = extrairIdDaUrl(req);
    const usuario = await autenticarRequisicao(req);
    verificarAdminAutorizado(usuario);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query('DELETE FROM convenios WHERE id = $1', [id]);

  if (resultado.rowCount !== 1) {
    return res.status(404).json({ erro: 'Convenio nao encontrado.' });
  }

  return res.status(200).json({ mensagem: 'Convenio excluido com sucesso.' });
}
