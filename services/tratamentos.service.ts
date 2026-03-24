import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface TratamentoListagem {
  id: string;
  nome: string;
  descricao: string | null;
  valor: string;
  ativo: boolean;
  criado_em: string;
}

export async function listarTratamentos(req: VercelRequest, res: VercelResponse) {
  try {
    autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<TratamentoListagem>(
    'SELECT id, nome, descricao, valor, ativo, criado_em FROM tratamentos ORDER BY nome ASC',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    tratamentos: resultado.rows,
  });
}
