import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  atualizarStatusConsulta,
  criarConsulta,
  excluirConsulta,
  listarConsultas,
} from '../../services/consultas.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarConsultas(req, res);
    case 'POST':
      return await criarConsulta(req, res);
    case 'PUT':
      return await atualizarStatusConsulta(req, res);
    case 'DELETE':
      return await excluirConsulta(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
