import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../_lib/auth';
import pool from '../_lib/db';
import { gerarSenhaHash } from '../_lib/password';
import type { CriarUsuarioInput, TipoUsuario, Usuario } from '../_lib/types';

interface CriarUsuarioBody {
  nome?: string;
  email?: string;
  senha?: string;
  tipo_usuario?: TipoUsuario;
}

function obterBody(req: VercelRequest): CriarUsuarioBody {
  if (!req.body) return {};
  if (typeof req.body === 'string') return JSON.parse(req.body) as CriarUsuarioBody;
  if (typeof req.body === 'object') return req.body as CriarUsuarioBody;
  return {};
}

function validarEntradaCriacao(body: CriarUsuarioBody): CriarUsuarioInput {
  if (typeof body.nome !== 'string' || typeof body.email !== 'string' || typeof body.senha !== 'string' || typeof body.tipo_usuario !== 'string') {
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

  if (tipoUsuario !== 'admin' && tipoUsuario !== 'operador') {
    throw new AuthError('tipo_usuario deve ser "admin" ou "operador".', 400);
  }

  return {
    nome,
    email,
    senha,
    tipo_usuario: tipoUsuario as TipoUsuario,
  };
}


async function criarUsuario(req: VercelRequest, res: VercelResponse) {
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
    const body = obterBody(req);
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return await criarUsuario(req, res);
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ erro: 'Metodo nao permitido' });
}
