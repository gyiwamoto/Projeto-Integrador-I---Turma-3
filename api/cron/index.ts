import type { VercelRequest, VercelResponse } from '@vercel/node';
import { executarWhatsappCron } from '../../services/whatsapp.service';
import { registrarLogSucesso } from '../../services/logsAcessos.service';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const querySecret = typeof req.query.secret === 'string' ? req.query.secret : '';
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : '';
    const bearerSecret = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

    if (!cronSecret || (querySecret !== cronSecret && bearerSecret !== cronSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await executarWhatsappCron();

    await registrarLogSucesso({
      req,
      statusHttp: 200,
      mensagem: `Cron WhatsApp finalizado. Mensagens enviadas: ${result.sucesso}. Falhas: ${result.falha}. Total processado: ${result.total}.`,
      rotaPadrao: '/api/cron',
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erro geral:', error);
    return res.status(500).json({ error: 'Erro interno' });
  }
}