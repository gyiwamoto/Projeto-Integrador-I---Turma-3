import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarTratamentos } from '../../services/tratamentos.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarTratamentos(req, res);
    default:
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
