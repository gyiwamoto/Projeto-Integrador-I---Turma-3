import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface TratamentoListagem {
  id: string;
  nome: string;
  descricao: string | null;
  valor: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

interface TratamentoBody {
  nome?: string;
  descricao?: string;
  valor?: number | string;
  ativo?: boolean;
}

function extrairIdDaUrl(req: VercelRequest): string {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  return id;
}

function obterBody(req: VercelRequest): TratamentoBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as TratamentoBody;
  if (typeof req.body === 'object') return req.body as TratamentoBody;
  return {};
}

export async function listarTratamentos(req: VercelRequest, res: VercelResponse) {
  try {
    await autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<TratamentoListagem>(
    'SELECT id, nome, descricao, valor, ativo, criado_em FROM tratamentos ORDER BY nome ASC',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    tratamentos: resultado.rows,
  });
}

export async function criarTratamento(req: VercelRequest, res: VercelResponse) {
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
      return res.status(400).json({ erro: 'Nome do tratamento eh obrigatorio.' });
    }

    if (body.valor === undefined || body.valor === null || String(body.valor).trim() === '') {
      return res.status(400).json({ erro: 'Valor do tratamento eh obrigatorio.' });
    }

    const valor = Number(body.valor);
    if (!Number.isFinite(valor) || valor < 0) {
      return res.status(400).json({ erro: 'Valor do tratamento invalido.' });
    }

    const nome = body.nome.trim();
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : null;
    const ativo = body.ativo ?? true;

    const resultado = await pool.query<TratamentoListagem>(
      `INSERT INTO tratamentos (nome, descricao, valor, ativo)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, descricao, valor, ativo, criado_em, atualizado_em`,
      [nome, descricao || null, valor, ativo],
    );

    if (resultado.rowCount !== 1) {
      return res.status(500).json({ erro: 'Erro ao criar tratamento.' });
    }

    return res.status(201).json({
      mensagem: 'Tratamento criado com sucesso.',
      tratamento: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao criar tratamento.' });
  }
}

export async function editarTratamento(req: VercelRequest, res: VercelResponse) {
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

    if (body.descricao !== undefined) {
      const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
      campos.push({ chave: 'descricao', valor: descricao || null });
    }

    if (body.valor !== undefined) {
      const valor = Number(body.valor);
      if (!Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({ erro: 'Valor do tratamento invalido.' });
      }

      campos.push({ chave: 'valor', valor });
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

    const resultado = await pool.query<TratamentoListagem>(
      `UPDATE tratamentos
          SET ${setClauses}
        WHERE id = $${campos.length + 1}
      RETURNING id, nome, descricao, valor, ativo, criado_em, atualizado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Tratamento nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Tratamento atualizado com sucesso.',
      tratamento: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar tratamento.' });
  }
}

export async function deletarTratamento(req: VercelRequest, res: VercelResponse) {
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

  const resultado = await pool.query('DELETE FROM tratamentos WHERE id = $1', [id]);

  if (resultado.rowCount !== 1) {
    return res.status(404).json({ erro: 'Tratamento nao encontrado.' });
  }

  return res.status(200).json({ mensagem: 'Tratamento excluido com sucesso.' });
}
