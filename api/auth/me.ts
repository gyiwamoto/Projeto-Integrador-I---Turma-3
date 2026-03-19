/**
 * Endpoint de validacao de sessao
 * GET /api/auth/me
 * Headers: Authorization: Bearer <token>
 * Retorna: { usuario }
 *
 * Valida o JWT e retorna os dados do usuario autenticado
 * Util para verificar se o token ainda eh valido e obter dados da sessao
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthError, autenticarRequisicao } from '../_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ erro: 'Metodo nao permitido' });
  }

  try {
    const usuario = autenticarRequisicao(req);

    return res.status(200).json({ usuario });
  } catch (error) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }

    return res.status(500).json({ erro: 'Erro interno ao validar token.' });
  }
}
