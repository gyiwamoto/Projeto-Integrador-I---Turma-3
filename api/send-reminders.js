import { sendMessage } from '../services/whatsapp-service.ts';

export default async function handler(req, res) {
  const consultas = await buscarConsultasQueDevemEnviarAgora();

  for (const c of consultas) {
    await sendMessage({
      to: c.telefone,
      body: Olá ${c.nome}, lembrete da sua consulta amanhã às ${c.hora}
    });
  }

  res.status(200).json({ ok: true });
}
