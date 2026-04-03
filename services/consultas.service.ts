import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../api/_lib/auth';
import pool from '../api/_lib/db';

interface ConsultaListagem {
  id: string;
  paciente_id: string;
  paciente_nome: string | null;
  usuario_id: string;
  usuario_nome: string | null;
  status: 'agendado' | 'realizado' | 'cancelado';
  data_consulta: string;
  convenio_id: string | null;
  convenio_nome: string | null;
  criado_em: string;
}

export async function listarConsultas(req: VercelRequest, res: VercelResponse) {
  try {
    await autenticarRequisicao(req);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<ConsultaListagem>(
    `SELECT c.id,
            c.paciente_id,
            p.nome AS paciente_nome,
            c.usuario_id,
            u.nome AS usuario_nome,
            c.status,
            c.data_consulta,
            c.convenio_id,
            cv.nome AS convenio_nome,
            c.criado_em
       FROM consultas c
       LEFT JOIN pacientes p ON p.id = c.paciente_id
       LEFT JOIN usuarios u ON u.id = c.usuario_id
       LEFT JOIN convenios cv ON cv.id = c.convenio_id
      ORDER BY c.data_consulta DESC`,
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    consultas: resultado.rows,
  });
}
