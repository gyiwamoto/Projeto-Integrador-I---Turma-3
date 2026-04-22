npm install twilio

import Twilio from 'twilio';

const client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

export async function sendMessage({ to, body }) {
  await client.messages.create({
    from: 'whatsapp:+14155238886', // sandbox
    to: whatsapp:${to},
    body
  });
}
