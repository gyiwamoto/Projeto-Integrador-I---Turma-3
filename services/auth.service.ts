import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  AuthError,
  autenticarRequisicao,
  criarCookieSessao,
  criarCookieSessaoEncerrada,
  gerarAccessToken,
} from '../api/_lib/auth';
import { validarSenha } from '../api/_lib/password';
import type { TipoUsuario } from '../api/_lib/types';
import { registrarLogFalha, registrarLogSucesso } from './logsAcessos.service';

interface LoginBody {
  email?: string;
  senha?: string;
}

interface UsuarioLoginRow {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !senha) {
    throw new AuthError('Email e senha sao obrigatorios.', 400);
  }

  if (!emailRegex.test(email)) {
    throw new AuthError('Email invalido.', 400);
  }

  return { email, senha };
}

export async function autenticarLogin(req: VercelRequest, res: VercelResponse) {
  let emailInformado: string | undefined;

  try {
    const { default: pool } = await import('../api/_lib/db');

    const body = obterBody(req);
    const { email, senha } = validarEntradaLogin(body);
    emailInformado = email;

    const resultado = await pool.query<UsuarioLoginRow>(
      'SELECT id, nome, email, senha_hash, tipo_usuario FROM usuarios WHERE email = $1 LIMIT 1',
      [email],
    );

    if (resultado.rowCount !== 1) {
      throw new AuthError('Credenciais invalidas.');
    }

    const usuario = resultado.rows[0];
    if (!usuario) {
      throw new AuthError('Credenciais invalidas.');
    }

    const senhaValida = await validarSenha(senha, usuario.senha_hash);

    if (!senhaValida) {
      throw new AuthError('Credenciais invalidas.');
    }

    const token = gerarAccessToken({
      id: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email,
      tipo_usuario: usuario.tipo_usuario,
    });

    await registrarLogSucesso({
      req,
      usuarioId: usuario.id,
      emailInformado: usuario.email,
      statusHttp: 200,
      mensagem: 'Login realizado com sucesso.',
      rotaPadrao: '/api/auth',
    });

    res.setHeader('Set-Cookie', criarCookieSessao(token));

    return res.status(200).json({
      token,
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
      await registrarLogFalha({
        req,
        emailInformado,
        statusHttp: 400,
        mensagem: 'Corpo da requisicao invalido.',
        rotaPadrao: '/api/auth',
      });

      return res.status(400).json({ erro: 'Corpo da requisicao invalido.' });
    }

    if (error instanceof AuthError) {
      await registrarLogFalha({
        req,
        emailInformado,
        statusHttp: error.statusCode,
        mensagem: error.message,
        rotaPadrao: '/api/auth',
      });

      return res.status(error.statusCode).json({ erro: error.message });
    }

    await registrarLogFalha({
      req,
      emailInformado,
      statusHttp: 500,
      mensagem: 'Erro interno ao autenticar usuario.',
      rotaPadrao: '/api/auth',
    });

    return res.status(500).json({ erro: 'Erro interno ao autenticar usuario.Tente novamente mais tarde.' });
  }
}

export async function obterSessaoAutenticada(req: VercelRequest, res: VercelResponse) {
  try {
    const usuario = await autenticarRequisicao(req);

    await registrarLogSucesso({
      req,
      usuarioId: usuario.id,
      emailInformado: usuario.email,
      statusHttp: 200,
      mensagem: 'Sessao validada com sucesso.',
      rotaPadrao: '/api/auth',
    });

    return res.status(200).json({ usuario });
  } catch (error) {
    if (error instanceof AuthError) {
      await registrarLogFalha({
        req,
        statusHttp: error.statusCode,
        mensagem: error.message,
        rotaPadrao: '/api/auth',
      });

      return res.status(error.statusCode).json({ erro: error.message });
    }

    await registrarLogFalha({
      req,
      statusHttp: 500,
      mensagem: 'Erro interno ao validar token.',
      rotaPadrao: '/api/auth',
    });

    return res.status(500).json({ erro: 'Erro interno ao validar token.' });
  }
}

export async function logout(req: VercelRequest, res: VercelResponse) {
  let usuarioId: number | string | null = null;
  let emailInformado: string | undefined;

  try {
    const usuario = await autenticarRequisicao(req);
    usuarioId = usuario.id;
    emailInformado = usuario.email;
  } catch {
    // Logout e idempotente e pode ocorrer sem token valido.
  }

  res.setHeader('Set-Cookie', criarCookieSessaoEncerrada());

  await registrarLogSucesso({
    req,
    usuarioId,
    emailInformado,
    statusHttp: 200,
    mensagem: 'Logout realizado com sucesso.',
    rotaPadrao: '/api/auth',
  });

  return res.status(200).json({ mensagem: 'Logout realizado com sucesso.' });
}
