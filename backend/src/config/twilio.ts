import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID?.trim();

// Only initialize if we have valid (non-empty) credentials
const hasValidCredentials = accountSid && authToken && accountSid.startsWith('AC');

if (!hasValidCredentials) {
  console.warn('⚠️  Twilio configuration incomplete. WhatsApp OTP will not be available.');
}

export const twilioClient = hasValidCredentials ? twilio(accountSid, authToken) : null;
export const TWILIO_VERIFY_SERVICE_SID = verifyServiceSid;
export const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

export default twilioClient;
