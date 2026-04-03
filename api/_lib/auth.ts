import type { JwtPayload, SignOptions } from 'jsonwebtoken';
import type { JwtUsuarioPayload, TipoUsuario } from './types';
import pool from './db';

interface RequestComAutenticacao {
  headers: Record<string, string | string[] | undefined>;
}

interface JwtTokenClaims extends JwtUsuarioPayload {
  sub: string;
}

interface UsuarioSessaoRow {
  id: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  ativo: boolean;
}

const jwt = require('jsonwebtoken/index.js') as typeof import('jsonwebtoken');

if (typeof jwt.sign !== 'function' || typeof jwt.verify !== 'function') {
  throw new Error('Biblioteca jsonwebtoken indisponivel para assinatura/validacao de token.');
}

const jwtSecret: string = process.env.JWT_SECRET ?? '';

if (!jwtSecret) {
  throw new Error('Variavel de ambiente JWT_SECRET nao configurada.');
}

// Configuracao do emissor do token e tempo de expiracao
const jwtIssuer = 'dentista-organizado-api';
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];
const authCookieName = process.env.AUTH_COOKIE_NAME ?? 'dentista_organizado_session';

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function isTipoUsuario(value: unknown): value is TipoUsuario {
  return value === 'admin' || value === 'dentista' || value === 'recepcionista';
}

/**
 * Gera um token JWT com os dados do usuario
 * O token contem o ID, nome, email e tipo de usuario
 */
export function gerarAccessToken(usuario: JwtUsuarioPayload): string {
  const payload: JwtTokenClaims = {
    sub: String(usuario.id),
    ...usuario,
  };

  const options: SignOptions = {
    expiresIn: jwtExpiresIn,
    issuer: jwtIssuer,
  };

  return jwt.sign(payload, jwtSecret, options);
}

export function extrairBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    throw new AuthError('Token nao enviado.');
  }

  const [scheme, token] = authorizationHeader.trim().split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new AuthError('Formato do token invalido. Use: Bearer <token>.');
  }

  return token;
}

function parseDuracaoParaSegundos(value: string): number {
  const valor = value.trim();
  const regex = /^(\d+)([smhd])$/i;
  const match = valor.match(regex);

  if (!match) {
    return 8 * 60 * 60;
  }

  const quantidade = Number(match[1]);
  const unidade = (match[2] ?? 'h').toLowerCase();

  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    return 8 * 60 * 60;
  }

  if (unidade === 's') return quantidade;
  if (unidade === 'm') return quantidade * 60;
  if (unidade === 'h') return quantidade * 60 * 60;

  return quantidade * 60 * 60 * 24;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(';').reduce<Record<string, string>>((acc, item) => {
    const [rawKey, ...rest] = item.split('=');
    const key = rawKey?.trim();
    const value = rest.join('=').trim();

    if (!key) {
      return acc;
    }

    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function extrairPrimeiroHeader(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) {
    return valor[0];
  }

  return valor;
}

function extrairTokenDoCookie(cookieHeader: string | undefined): string {
  const cookies = parseCookies(cookieHeader);
  const token = cookies[authCookieName];

  if (!token) {
    throw new AuthError('Token nao enviado.');
  }

  return token;
}

export function criarCookieSessao(token: string): string {
  const maxAge = parseDuracaoParaSegundos(String(jwtExpiresIn));
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${authCookieName}=${encodeURIComponent(token)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function criarCookieSessaoEncerrada(): string {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${authCookieName}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; SameSite=Lax${secureFlag}`;
}

export function verificarAccessToken(token: string): JwtUsuarioPayload {
  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, jwtSecret, { issuer: jwtIssuer });
  } catch {
    throw new AuthError('Token invalido ou expirado.');
  }

  if (typeof decoded === 'string') {
    throw new AuthError('Payload do token invalido.');
  }

  const idRaw = decoded.id ?? decoded.sub;
  const id = typeof idRaw === 'string' || typeof idRaw === 'number' ? String(idRaw).trim() : '';
  const nome = decoded.nome;
  const email = decoded.email;
  const tipoUsuario = decoded.tipo_usuario;

  if (!id || typeof nome !== 'string' || typeof email !== 'string' || !isTipoUsuario(tipoUsuario)) {
    throw new AuthError('Token com payload invalido.');
  }

  return {
    id,
    nome,
    email,
    tipo_usuario: tipoUsuario,
  };
}

export async function autenticarRequisicao(req: RequestComAutenticacao): Promise<JwtUsuarioPayload> {
  const authorization = extrairPrimeiroHeader(req.headers.authorization);
  const cookie = extrairPrimeiroHeader(req.headers.cookie);

  const token = authorization ? extrairBearerToken(authorization) : extrairTokenDoCookie(cookie);

  const usuarioToken = verificarAccessToken(token);

  const resultado = await pool.query<UsuarioSessaoRow>(
    'SELECT id, nome, email, tipo_usuario, ativo FROM usuarios WHERE id = $1 LIMIT 1',
    [usuarioToken.id],
  );

  if (resultado.rowCount !== 1) {
    throw new AuthError('Sessao invalida.', 401);
  }

  const usuario = resultado.rows[0];

  if (!usuario || !usuario.ativo) {
    throw new AuthError('Sessao invalida.', 401);
  }

  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    tipo_usuario: usuario.tipo_usuario,
  };
}


export function verificarAdminAutorizado(usuario: JwtUsuarioPayload): void {
  if (usuario.tipo_usuario !== 'admin') {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}

export function verificarPermissaoAcesso(usuario: JwtUsuarioPayload, usuarioIdSolicitado: string | number): void {
  if (usuario.tipo_usuario === 'admin') {
    return;
  }

  if (usuario.id !== String(usuarioIdSolicitado)) {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}

export function verificarPermissaoDeletar(usuario: JwtUsuarioPayload): void {
  if (usuario.tipo_usuario !== 'admin') {
    throw new AuthError('Apenas administradores podem deletar dados.', 403);
  }
}
