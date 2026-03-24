import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthError,
  autenticarRequisicao,
  verificarAdminAutorizado,
  verificarPermissaoAcesso,
} from '../api/_lib/auth';
import pool from '../api/_lib/db';
import { gerarSenhaHash } from '../api/_lib/password';
import type { CriarUsuarioInput, JwtUsuarioPayload, TipoUsuario, Usuario } from '../api/_lib/types';

interface CriarUsuarioBody {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: TipoUsuario;
}

interface EditarUsuarioBody {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: TipoUsuario;
}

function extrairIdDaUrl(req: VercelRequest): number {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  const parsed = Number(id);

  if (!Number.isFinite(parsed)) {
    throw new AuthError('ID deve ser um numero valido.', 400);
  }

  return parsed;
}

function obterBodyCriacao(req: VercelRequest): CriarUsuarioBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as CriarUsuarioBody;
  if (typeof req.body === 'object') return req.body as CriarUsuarioBody;
  return {};
}

function obterBodyEdicao(req: VercelRequest): EditarUsuarioBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as EditarUsuarioBody;
  if (typeof req.body === 'object') return req.body as EditarUsuarioBody;
  return {};
}

function validarEntradaCriacao(body: CriarUsuarioBody): CriarUsuarioInput {
  if (
    typeof body.nome !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.senha !== 'string' ||
    typeof body.tipo_usuario !== 'string'
  ) {
    throw new AuthError('Nome, email, senha e tipo_usuario sao obrigatorios.', 400);
  }

  const nome = body.nome.trim();
  const email = body.email.trim().toLowerCase();
  const senha = body.senha.trim();
  const tipoUsuario = body.tipo_usuario.trim().toLowerCase();

  if (!nome || !email || !senha) {
    throw new AuthError('Nome, email e senha nao podem estar vazios.', 400);
  }

  if (!email.includes('@')) {
    throw new AuthError('Email invalido.', 400);
  }

  if (tipoUsuario !== 'admin' && tipoUsuario !== 'dentista' && tipoUsuario !== 'recepcionista') {
    throw new AuthError('tipo_usuario deve ser "admin" ou "dentista" ou "recepcionista".', 400);
  }

  return {
    nome,
    email,
    senha,
    tipo_usuario: tipoUsuario as TipoUsuario,
  };
}

export async function listarUsuarios(req: VercelRequest, res: VercelResponse) {
  try {
    const usuarioLogado = autenticarRequisicao(req);
    verificarAdminAutorizado(usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<Omit<Usuario, 'senha'>>(
    'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios ORDER BY id',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    usuarios: resultado.rows,
  });
}

export async function obterUsuarioPorId(req: VercelRequest, res: VercelResponse) {
  try {
    const id = extrairIdDaUrl(req);

    let usuarioLogado: JwtUsuarioPayload;
    try {
      usuarioLogado = autenticarRequisicao(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
      return res.status(401).json({ erro: 'Requer autenticacao.' });
    }

    try {
      verificarPermissaoAcesso(usuarioLogado, id);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
    }

    const resultado = await pool.query<Omit<Usuario, 'senha'>>(
      'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios WHERE id = $1',
      [id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    }

    return res.status(200).json({ usuario: resultado.rows[0] });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno.' });
  }
}

export async function criarUsuario(req: VercelRequest, res: VercelResponse) {
  try {
    const usuarioLogado = autenticarRequisicao(req);
    verificarAdminAutorizado(usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  try {
    const body = obterBodyCriacao(req);
    const dados = validarEntradaCriacao(body);

    const senhaHash = await gerarSenhaHash(dados.senha);

    const resultado = await pool.query<Omit<Usuario, 'senha'>>(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, tipo_usuario, criado_em',
      [dados.nome, dados.email, senhaHash, dados.tipo_usuario],
    );

    if (resultado.rowCount !== 1) {
      return res.status(500).json({ erro: 'Erro ao criar usuario.' });
    }

    return res.status(201).json({
      mensagem: 'Usuario criado com sucesso.',
      usuario: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return res.status(409).json({ erro: 'Email ja existe.' });
      }
    }

    return res.status(500).json({ erro: 'Erro interno ao criar usuario.' });
  }
}

export async function editarUsuario(req: VercelRequest, res: VercelResponse) {
  try {
    const id = extrairIdDaUrl(req);

    let usuarioLogado: JwtUsuarioPayload;
    try {
      usuarioLogado = autenticarRequisicao(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
      return res.status(401).json({ erro: 'Requer autenticacao.' });
    }

    try {
      verificarPermissaoAcesso(usuarioLogado, id);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
    }

    const body = obterBodyEdicao(req);

    const campos: { chave: string; valor: unknown }[] = [];

    if (body.nome !== undefined) {
      if (typeof body.nome !== 'string' || !body.nome.trim()) {
        return res.status(400).json({ erro: 'Nome deve ser uma string nao-vazia.' });
      }
      campos.push({ chave: 'nome', valor: body.nome.trim() });
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !body.email.includes('@')) {
        return res.status(400).json({ erro: 'Email invalido.' });
      }
      campos.push({ chave: 'email', valor: body.email.trim().toLowerCase() });
    }

    if (body.tipo_usuario !== undefined) {
      if (usuarioLogado.tipo_usuario !== 'admin') {
        return res.status(403).json({ erro: 'Apenas administradores podem alterar tipo de usuario.' });
      }
      const tipo = (body.tipo_usuario as string).toLowerCase();
      if (tipo !== 'admin' && tipo !== 'dentista' && tipo !== 'recepcionista') {
        return res.status(400).json({ erro: 'tipo_usuario deve ser "admin" ou "dentista" ou "recepcionista".' });
      }
      campos.push({ chave: 'tipo_usuario', valor: tipo });
    }

    if (body.senha !== undefined) {
      if (typeof body.senha !== 'string') {
        return res.status(400).json({ erro: 'Senha deve ser uma string.' });
      }
      const senhaHash = await gerarSenhaHash(body.senha);
      campos.push({ chave: 'senha', valor: senhaHash });
    }

    if (campos.length === 0) {
      return res.status(400).json({ erro: 'Nenhum campo para atualizar.' });
    }

    const setClauses = campos.map((campo, i) => `${campo.chave} = $${i + 1}`).join(', ');
    const valores = campos.map((campo) => campo.valor);

    const resultado = await pool.query<Omit<Usuario, 'senha'>>(
      `UPDATE usuarios SET ${setClauses} WHERE id = $${campos.length + 1} RETURNING id, nome, email, tipo_usuario, criado_em`,
      [...valores, id],
    );

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    }

    return res.status(200).json({
      mensagem: 'Usuario atualizado com sucesso.',
      usuario: resultado.rows[0],
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return res.status(409).json({ erro: 'Email ja existe.' });
      }
    }

    return res.status(500).json({ erro: 'Erro interno ao atualizar usuario.' });
  }
}

export async function deletarUsuario(req: VercelRequest, res: VercelResponse) {
  try {
    const id = extrairIdDaUrl(req);

    let usuarioLogado: JwtUsuarioPayload;
    try {
      usuarioLogado = autenticarRequisicao(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
      return res.status(401).json({ erro: 'Requer autenticacao.' });
    }

    try {
      verificarAdminAutorizado(usuarioLogado);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
    }

    const resultado = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Usuario excluido com sucesso.' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno ao excluir usuario.' });
  }
}
