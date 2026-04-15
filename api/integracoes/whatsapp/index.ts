TWILIO_ACCOUNT_SID=AC3b2a0eb68b4fcaf0591794c1c018525e
TWILIO_AUTH_TOKEN=e20604458ceb7a84c77aff67ebefbd36
TWILIO_PHONE_NUMBER=+13204334771

import twilio from 'twilio';

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export async function enviarMensagemWhatsApp(to: string, body: string) {
  try {
    const message = await client.messages.create({
      body,
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`
    });
    return { success: true, sid: message.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
