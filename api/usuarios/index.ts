import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../_lib/auth';
import pool from '../_lib/db';
import type { Usuario } from '../_lib/types';

async function listarUsuarios(req: VercelRequest, res: VercelResponse) {
  try {
    const usuarioLogado = autenticarRequisicao(req);
    verificarAdminAutorizado(usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(401).json({ erro: 'Requer autenticacao.' });
  }

  const resultado = await pool.query<Omit<Usuario, 'senha'>>(
    'SELECT id, nome, email, tipo_usuario, criado_em FROM usuarios ORDER BY id',
  );

  return res.status(200).json({
    total: resultado.rowCount ?? 0,
    usuarios: resultado.rows,
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      return await listarUsuarios(req, res);
    } catch {
      return res.status(500).json({ erro: 'Erro interno ao listar usuarios.' });
    }
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).json({ erro: 'Metodo nao permitido' });
}
