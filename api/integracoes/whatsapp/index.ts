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
