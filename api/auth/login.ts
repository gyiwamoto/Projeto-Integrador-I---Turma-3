import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, gerarAccessToken } from '../_lib/auth';
import pool from '../_lib/db';
import { validarSenha } from '../_lib/password';
import type { TipoUsuario } from '../_lib/types';

interface LoginBody {
  email?: string;
  senha?: string;
}

interface UsuarioLoginRow {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo_usuario: TipoUsuario;
}

function obterBody(req: VercelRequest): LoginBody {
  if (!req.body) {
    return {};
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as LoginBody;
  }

  if (typeof req.body === 'object') {
    return req.body as LoginBody;
  }

  return {};
}

function validarEntradaLogin(body: LoginBody): { email: string; senha: string } {
  if (typeof body.email !== 'string' || typeof body.senha !== 'string') {
    throw new AuthError('Email e senha sao obrigatorios.', 400);
  }

  const email = body.email.trim().toLowerCase();
  const senha = body.senha.trim();
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !senha) {
    throw new AuthError('Email e senha sao obrigatorios.', 400);
  }

  if (!EMAIL_REGEX.test(email)) {
    throw new AuthError('Email invalido.', 400);
  }

  return { email, senha };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ erro: 'Metodo nao permitido' });
  }

  try {
    const body = obterBody(req);
    const { email, senha } = validarEntradaLogin(body);

    const resultado = await pool.query<UsuarioLoginRow>(
      'SELECT id, nome, email, senha, tipo_usuario FROM usuarios WHERE email = $1 LIMIT 1',
      [email],
    );

    if (resultado.rowCount !== 1) {
      throw new AuthError('Credenciais invalidas.');
    }

    const usuario = resultado.rows[0];
    const senhaValida = await validarSenha(senha, usuario.senha);

    if (!senhaValida) {
      throw new AuthError('Credenciais invalidas.');
    }

    const token = gerarAccessToken({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
    });

    return res.status(200).json({
      token,
      tipo_token: 'Bearer',
      expira_em: process.env.JWT_EXPIRES_IN ?? '8h',
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo_usuario: usuario.tipo_usuario,
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno ao autenticar usuario.Tente novamente mais tarde.' });
  }
}
