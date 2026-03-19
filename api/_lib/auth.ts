import type { VercelRequest } from '@vercel/node';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { JwtUsuarioPayload, TipoUsuario } from './types';

const jwtSecret: string = process.env.JWT_SECRET ?? '';

if (!jwtSecret) {
  throw new Error('Variavel de ambiente JWT_SECRET nao configurada.');
}

// Configuracao do emissor do token e tempo de expiracao
const jwtIssuer = 'doces-delicia-api';
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '8h') as SignOptions['expiresIn'];

export class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
  }
}

function isTipoUsuario(value: unknown): value is TipoUsuario {
  return value === 'admin' || value === 'operador';
}

/**
 * Gera um token JWT com os dados do usuario
 * O token contem o ID, nome, email e tipo de usuario
 */
export function gerarAccessToken(usuario: Omit<JwtUsuarioPayload, 'sub'>): string {
  const payload: JwtUsuarioPayload = {
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

  const id = typeof decoded.id === 'number' ? decoded.id : Number(decoded.sub);
  const nome = decoded.nome;
  const email = decoded.email;
  const tipoUsuario = decoded.tipo_usuario;

  if (!Number.isFinite(id) || typeof nome !== 'string' || typeof email !== 'string' || !isTipoUsuario(tipoUsuario)) {
    throw new AuthError('Token com payload invalido.');
  }

  return {
    sub: String(decoded.sub ?? id),
    id,
    nome,
    email,
    tipo_usuario: tipoUsuario,
  };
}

export function autenticarRequisicao(req: VercelRequest): JwtUsuarioPayload {
  const token = extrairBearerToken(req.headers.authorization);
  return verificarAccessToken(token);
}


export function verificarAdminAutorizado(usuario: JwtUsuarioPayload): void {
  if (usuario.tipo_usuario !== 'admin') {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}

export function verificarPermissaoAcesso(usuario: JwtUsuarioPayload, usuarioIdSolicitado: number): void {
  if (usuario.tipo_usuario === 'admin') {
    return; 
  }

  if (usuario.id !== usuarioIdSolicitado) {
    throw new AuthError('Acesso Restrito a Administradores.', 403);
  }
}
