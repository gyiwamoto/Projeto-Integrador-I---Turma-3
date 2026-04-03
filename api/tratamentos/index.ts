import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  criarTratamento,
  deletarTratamento,
  editarTratamento,
  listarTratamentos,
} from '../../services/tratamentos.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarTratamentos(req, res);
    case 'POST':
      return await criarTratamento(req, res);
    case 'PUT':
      return await editarTratamento(req, res);
    case 'DELETE':
      return await deletarTratamento(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
