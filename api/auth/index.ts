import type { VercelRequest, VercelResponse } from '@vercel/node';
import { autenticarLogin, logout, obterSessaoAutenticada } from '../../services/auth.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'POST':
      return await autenticarLogin(req, res);
    case 'GET':
      return await obterSessaoAutenticada(req, res);
    case 'DELETE':
      return await logout(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
