import type { VercelRequest } from '@vercel/node';
import pool from '../api/_lib/db';

export interface RegistrarLogAcessoInput {
  req: VercelRequest;
  usuarioId?: number | string | null;
  emailInformado?: string;
  statusHttp: number;
  sucesso: boolean;
  mensagem: string;
  rotaPadrao?: string;
}

interface RegistrarLogResultadoInput extends Omit<RegistrarLogAcessoInput, 'sucesso'> {}

function extrairHeaderComoString(header: string | string[] | undefined): string | null {
  if (!header) {
    return null;
  }

  if (Array.isArray(header)) {
    return header[0] ?? null;
  }

  return header;
}

function obterIpOrigem(req: VercelRequest): string | null {
  const forwardedFor = extrairHeaderComoString(req.headers['x-forwarded-for']);

  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || null;
  }

  return null;
}

function obterUserAgent(req: VercelRequest): string | null {
  return extrairHeaderComoString(req.headers['user-agent']);
}

function obterRota(req: VercelRequest, rotaPadrao: string): string {
  if (typeof req.url === 'string' && req.url.trim()) {
    return req.url;
  }

  return rotaPadrao;
}

export async function registrarLogAcesso(input: RegistrarLogAcessoInput): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO logs_acessos (
          usuario_id,
          email_informado,
          ip_origem,
          user_agent,
          rota,
          metodo_http,
          status_http,
          sucesso,
          mensagem
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        input.usuarioId ?? null,
        input.emailInformado ?? null,
        obterIpOrigem(input.req),
        obterUserAgent(input.req),
        obterRota(input.req, input.rotaPadrao ?? '/api'),
        input.req.method ?? 'UNKNOWN',
        input.statusHttp,
        input.sucesso,
        input.mensagem,
      ],
    );
  } catch {
    // Nao interrompe o fluxo principal da API caso o log falhe.
  }
}

export async function registrarLogSucesso(input: RegistrarLogResultadoInput): Promise<void> {
  await registrarLogAcesso({
    ...input,
    sucesso: true,
  });
}

export async function registrarLogFalha(input: RegistrarLogResultadoInput): Promise<void> {
  await registrarLogAcesso({
    ...input,
    sucesso: false,
  });
}
