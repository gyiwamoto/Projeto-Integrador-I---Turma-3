import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarProcedimentosRealizados } from '../../services/procedimentosRealizados.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarProcedimentosRealizados(req, res);
    default:
      res.setHeader('Allow', 'GET');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
