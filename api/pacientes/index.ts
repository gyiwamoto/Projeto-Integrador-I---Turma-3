import type { VercelRequest, VercelResponse } from '@vercel/node';

// TODO: implementar endpoints de pacientes
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ mensagem: 'API de pacientes em construção' });
}
