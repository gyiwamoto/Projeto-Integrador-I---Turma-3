import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  criarUsuario,
  deletarUsuario,
  editarUsuario,
  listarUsuarios,
  obterUsuarioPorId,
} from '../../services/usuarios.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      if (req.query.id !== undefined) {
        return await obterUsuarioPorId(req, res);
      }

      return await listarUsuarios(req, res);
    case 'POST':
      return await criarUsuario(req, res);
    case 'PUT':
      return await editarUsuario(req, res);
    case 'DELETE':
      return await deletarUsuario(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
