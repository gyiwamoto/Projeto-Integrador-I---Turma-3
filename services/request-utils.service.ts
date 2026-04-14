import { AuthError } from '../api/_lib/auth';
import type { VercelRequest, VercelResponse } from './http.types';

export function obterBody<T>(req: VercelRequest): T {
  if (!req.body) {
    return {} as T;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as T;
  }

  if (typeof req.body === 'object') {
    return req.body as T;
  }

  return {} as T;
}

export function responderErroAutenticacao(
  res: VercelResponse,
  error: unknown,
): VercelResponse {
  if (error instanceof AuthError) {
    return res.status(error.statusCode).json({ erro: error.message });
  }

  return res.status(401).json({ erro: 'Requer autenticacao.' });
}

export function extrairIdDaUrlString(req: VercelRequest): string {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    throw new AuthError('ID invalido.', 400);
  }

  return id;
}

export function extrairIdDaUrlNumero(req: VercelRequest): number {
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
