import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  criarProcedimentoRealizado,
  atualizarProcedimentoRealizado,
  listarProcedimentosRealizados,
} from '../../services/procedimentosRealizados.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarProcedimentosRealizados(req, res);
    case 'POST':
      return await criarProcedimentoRealizado(req, res);
    case 'PUT':
      return await atualizarProcedimentoRealizado(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
