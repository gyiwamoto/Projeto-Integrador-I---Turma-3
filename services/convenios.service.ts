import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ConvenioListagem {
  id: string;
  nome: string;
  criado_em: string;
}

export async function listarConvenios(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<ConvenioListagem>(
    'SELECT id, nome, ativo, atualizado_em FROM convenios ORDER BY nome ASC',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    convenios: resultado.rows,
  });
}
