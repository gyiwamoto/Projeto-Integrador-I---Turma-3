import pool from '../api/_lib/db';
import { formatarDataSaidaBr, obterTimezoneNegocio } from '../api/_lib/date-time';
import { normalizarTelefone, obterClienteTwilio } from '../api/_lib/twilio';
import type { ConsultaWhatsapp } from '../api/_lib/types';

type TemplateKey =
  | 'confirmacaoAgendamento'
  | 'lembreteConsulta'
  | 'posRealizacao';

type TemplateParams = {
  confirmacaoAgendamento: [string, string, string, string];
  lembreteConsulta: [string, string, string];
  posRealizacao: [string];
};

const whatsappTemplates: { [K in TemplateKey]: (...args: TemplateParams[K]) => string } = {
  confirmacaoAgendamento: (
    paciente: string,
    data: string,
    horario: string,
    dentista: string
  ) => `Olá, *${paciente}*! 😊

Sua consulta na *Clínica Sousa Iwamoto Odontologia* com a dra. *${dentista}* foi agendada com sucesso.

📅 Data: *${data}*
⏰ Horário: *${horario}*

Caso precise reagendar, é só nos avisar por aqui.`,

  lembreteConsulta: (
    paciente: string,
    data: string,
    horario: string
  ) => `Oi, *${paciente}*! 😊

Lembrete da sua consulta:

📅 *${data}*
⏰ *${horario}*`,

  posRealizacao: (paciente: string) =>
    `Olá, *${paciente}*! 😊

A Clínica Sousa Iwamoto Odontologia agradece pela confiança no atendimento de hoje.

Qualquer coisa estamos à disposição.`
};

export async function enviarMensagem<T extends TemplateKey>({
  to,
  template,
  params,
}: {
  to: string;
  template: T;
  params: TemplateParams[T];
}) {
  const client = obterClienteTwilio();
  const toNormalizado = normalizarTelefone(to); 
  console.log(toNormalizado);

  const templateFn = whatsappTemplates[template] as (...args: TemplateParams[T]) => string;
  const body = templateFn(...params);

  await client.messages.create({
    from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER || '+14155238886'}`,//playground number
    to: `whatsapp:${toNormalizado}`,
    body,
  });
}

export async function buscarConsultasAmanha(): Promise<ConsultaWhatsapp[]> {
  const timezone = obterTimezoneNegocio();

  const sql = `
    SELECT 
      c.id,
      c.data_consulta,
      p.nome AS paciente_nome,
      p.telefone,
      u.nome AS dentista_nome
    FROM consultas c
    JOIN pacientes p ON p.id = c.paciente_id
    JOIN usuarios u ON u.id = c.usuario_id
    WHERE 
      c.status = 'agendado'
      AND c.lembrete_enviado = false
      AND p.whatsapp_push = true
      AND (c.data_consulta AT TIME ZONE $1)::date =
          (NOW() AT TIME ZONE $1)::date + INTERVAL '1 day'
  `;

  const result = await pool.query<ConsultaWhatsapp>(sql, [timezone]);
  return result.rows;
}

export async function marcarLembreteEnviado(id: string) {
  await pool.query(
    `UPDATE consultas
     SET lembrete_enviado = true, atualizado_em = NOW()
     WHERE id = $1`,
    [id],
  );
}

export async function executarWhatsappCron() {
  let total = 0;
  let sucesso = 0;
  let falha = 0;

  const consultas = await buscarConsultasAmanha();
  total = consultas.length;

  if (!consultas.length) {
    return {
      total,
      sucesso,
      falha,
    };
  }

  for (const c of consultas) {
    try {
      const dataHora = formatarDataSaidaBr(c.data_consulta, true);

      const [data = '', hora = ''] = dataHora.split(' ');

      await enviarMensagem({
        to: c.telefone,
        template: 'lembreteConsulta',
        params: [c.paciente_nome, data, hora],
      });

      await marcarLembreteEnviado(c.id);

      sucesso++;
    } catch (err) {
      console.error(`Erro ao enviar para ${c.telefone}`, err);
      falha++;
    }
  }

  return {
    total,
    sucesso,
    falha,
  };
}