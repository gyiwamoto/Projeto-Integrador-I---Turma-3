import Twilio from 'twilio';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID ?? process.env.TWILIO_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? process.env.TWILIO_TOKEN;

export function obterClienteTwilio() {
  if (!twilioAccountSid || !twilioAuthToken) {
    throw new Error('Twilio nao configurado. Defina TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN.');
  }

  return Twilio(twilioAccountSid, twilioAuthToken);
}
