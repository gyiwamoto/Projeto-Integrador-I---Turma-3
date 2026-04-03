import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  criarConvenio,
  deletarConvenio,
  editarConvenio,
  listarConvenios,
} from '../../services/convenios.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarConvenios(req, res);
    case 'POST':
      return await criarConvenio(req, res);
    case 'PUT':
      return await editarConvenio(req, res);
    case 'DELETE':
      return await deletarConvenio(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
