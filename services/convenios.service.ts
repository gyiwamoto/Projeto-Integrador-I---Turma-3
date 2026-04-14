import type { VercelRequest, VercelResponse } from './http.types';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../api/_lib/auth';
import pool from '../api/_lib/db';
import { extrairIdDaUrlString, obterBody } from './request-utils.service';

interface ConvenioListagem {
  id: string;
  nome: string;
  cnpj: string | null;
  ativo: boolean;
  atualizado_em: string;
  criado_em: string;
}

interface ConvenioBody {
  nome?: string;
  cnpj?: string;
  ativo?: boolean;
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
    'SELECT cnpj AS id, nome, cnpj, ativo, atualizado_em, criado_em FROM convenios ORDER BY nome ASC',
  );

  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

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
    const body = obterBody<ConvenioBody>(req);

    if (typeof body.nome !== 'string' || !body.nome.trim()) {
      return res.status(400).json({ erro: 'Nome do convenio eh obrigatorio.' });
    }

    const nome = body.nome.trim();
    const cnpj = typeof body.cnpj === 'string' ? body.cnpj.trim() : '';

    if (!cnpj) {
      return res.status(400).json({ erro: 'CNPJ do convenio eh obrigatorio.' });
    }

    const ativo = body.ativo ?? true;

    const resultado = await pool.query<ConvenioListagem>(
      `INSERT INTO convenios (nome, cnpj, ativo)
       VALUES ($1, $2, $3)
       RETURNING cnpj AS id, nome, cnpj, ativo, criado_em, atualizado_em`,
      [nome, cnpj, ativo],
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
  let cnpjAtual: string;

  try {
    cnpjAtual = extrairIdDaUrlString(req);
    const usuario = await autenticarRequisicao(req);
    verificarAdminAutorizado(usuario);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = obterBody<ConvenioBody>(req);
    const campos: { chave: string; valor: unknown }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }

      campos.push({ chave: 'nome', valor: body.nome.trim() });
    }

    if (body.cnpj !== undefined) {
      const cnpjNovo = typeof body.cnpj === 'string' ? body.cnpj.trim() : '';
      if (!cnpjNovo) {
        return res.status(400).json({ erro: 'CNPJ do convenio nao pode ser vazio.' });
      }
      campos.push({ chave: 'cnpj', valor: cnpjNovo });
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
        WHERE cnpj = $${campos.length + 1}
      RETURNING cnpj AS id, nome, cnpj, ativo, criado_em, atualizado_em`,
      [...valores, cnpjAtual],
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
  let cnpj: string;

  try {
    cnpj = extrairIdDaUrlString(req);
    const usuario = await autenticarRequisicao(req);
    verificarAdminAutorizado(usuario);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query('DELETE FROM convenios WHERE cnpj = $1', [cnpj]);

  if (resultado.rowCount !== 1) {
    return res.status(404).json({ erro: 'Convenio nao encontrado.' });
  }

  return res.status(200).json({ mensagem: 'Convenio excluido com sucesso.' });
}
