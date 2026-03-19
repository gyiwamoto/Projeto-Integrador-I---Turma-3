import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao, verificarAdminAutorizado } from '../../_lib/auth';
import pool from '../../_lib/db';
import type { JwtUsuarioPayload } from '../../_lib/types';

function extrairIdDaUrl(req: VercelRequest): number {
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

async function excluirUsuario(req: VercelRequest, id: number, res: VercelResponse, usuarioLogado: JwtUsuarioPayload) {
  try {
    verificarAdminAutorizado(usuarioLogado);
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
  }

  try {
    const resultado = await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);

    if (resultado.rowCount !== 1) {
      return res.status(404).json({ erro: 'Usuario nao encontrado.' });
    }

    return res.status(200).json({ mensagem: 'Usuario excluido com sucesso.' });
  } catch {
    return res.status(500).json({ erro: 'Erro interno ao excluir usuario.' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const id = extrairIdDaUrl(req);

    let usuarioLogado: JwtUsuarioPayload;
    try {
      usuarioLogado = autenticarRequisicao(req);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(error.statusCode).json({ erro: error.message });
      }
      return res.status(401).json({ erro: 'Requer autenticacao.' });
    }

    if (req.method === 'DELETE') {
      return await excluirUsuario(req, id, res, usuarioLogado);
    }

    res.setHeader('Allow', 'DELETE');
    return res.status(405).json({ erro: 'Metodo nao permitido' });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno.' });
  }
}
