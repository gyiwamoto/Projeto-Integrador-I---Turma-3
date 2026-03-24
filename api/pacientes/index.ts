/**
 * Endpoint de pacientes
 * Requer autenticacao com JWT Bearer token
 * Usuarios autenticados: criar e editar pacientes
 * Admin: deletar pacientes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listarPacientes, criarPaciente, editarPaciente, deletarPaciente } from '../../services/pacientes.service';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  switch (req.method) {
    case 'GET':
      return await listarPacientes(req, res);
    case 'POST':
      return await criarPaciente(req, res);
    case 'PUT':
      return await editarPaciente(req, res);
    case 'DELETE':
      return await deletarPaciente(req, res);
    default:
      res.setHeader('Allow', 'GET, POST, PUT, DELETE');
      return res.status(405).json({ erro: 'Metodo nao permitido' });
  }
}
