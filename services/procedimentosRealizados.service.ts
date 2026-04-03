import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ProcedimentoRealizadoListagem {
  id: string;
  consulta_id: string;
  tratamento_id: string;
  tratamento_nome: string | null;
  dente: number | null;
  face: string | null;
  data_procedimento: string;
  observacoes: string | null;
  criado_em: string;
}

export async function listarProcedimentosRealizados(req: VercelRequest, res: VercelResponse) {
  try {
    await autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<ProcedimentoRealizadoListagem>(
    `SELECT pr.id,
            pr.consulta_id,
            pr.tratamento_id,
            t.nome AS tratamento_nome,
            pr.dente,
            pr.face,
            pr.data_procedimento,
            pr.observacoes,
            pr.criado_em
       FROM procedimentos_realizados pr
       LEFT JOIN tratamentos t ON t.id = pr.tratamento_id
      ORDER BY pr.data_procedimento DESC`,
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    procedimentos_realizados: resultado.rows,
  });
}
