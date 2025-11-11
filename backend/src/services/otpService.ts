import { supabase } from '../config/database';
import { emailTransporter, EMAIL_FROM } from '../config/email';
import { twilioClient } from '../config/twilio';
import { generateOTP, formatPhoneForWhatsApp } from '../utils/otp';
import { OTPMedium } from '../types';

const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

export const sendOTP = async (identifier: string, medium: OTPMedium): Promise<void> => {
  // Development bypass: Use fixed OTP code in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  const code = isDevelopment ? '123456' : generateOTP();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store OTP in database
  console.log('Attempting to store OTP in database for:', identifier);
  const { error } = await supabase
    .from('otp')
    .insert({
      user_identifier: identifier,
      code,
      medium,
      expires_at: expiresAt.toISOString(),
    });

  if (error) {
    console.error('Supabase OTP insert error:', error);
    throw new Error(`Failed to generate OTP: ${error.message}`);
  }

  if (isDevelopment) {
    console.log('🔧 DEVELOPMENT MODE: OTP code is always 123456');
    console.log(`OTP for ${identifier}: 123456 (expires in ${OTP_EXPIRY_MINUTES} minutes)`);
  } else {
    console.log('OTP stored successfully, code:', code);
  }

  // Send OTP based on medium (skip in development for unrestricted testing)
  if (!isDevelopment) {
    if (medium === 'email') {
      await sendEmailOTP(identifier, code);
    } else if (medium === 'whatsapp') {
      await sendWhatsAppOTP(identifier, code);
    }
  } else {
    console.log('📱 Development mode: Skipping actual OTP send. Use code: 123456');
  }
};

const sendEmailOTP = async (email: string, code: string): Promise<void> => {
  try {
    await emailTransporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your Padel App Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00D4AA;">Padel Community App</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #00D4AA; font-size: 48px; letter-spacing: 8px;">${code}</h1>
          <p>This code will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Email OTP error:', error);
    throw new Error('Failed to send email OTP');
  }
};

const sendWhatsAppOTP = async (phone: string, code: string): Promise<void> => {
  if (!twilioClient) {
    throw new Error('WhatsApp OTP service not configured');
  }

  try {
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
    const contentSid = process.env.TWILIO_CONTENT_SID;

    if (!contentSid) {
      throw new Error('TWILIO_CONTENT_SID not configured');
    }

    // Using Twilio Content API with approved WhatsApp template
    await twilioClient.messages.create({
      from: fromNumber,
      to: `whatsapp:${formattedPhone}`,
      contentSid: contentSid,
      contentVariables: JSON.stringify({
        1: code
      })
    });

    console.log(`WhatsApp OTP sent successfully to ${phone} using approved template`);
  } catch (error) {
    console.error('WhatsApp OTP error:', error);
    throw new Error('Failed to send WhatsApp OTP');
  }
};

export const verifyOTP = async (
  identifier: string,
  code: string
): Promise<boolean> => {
  // Fetch the latest OTP for this identifier
  const { data, error } = await supabase
    .from('otp')
    .select('*')
    .eq('user_identifier', identifier)
    .eq('verified', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error('No valid OTP found');
  }

  // Check if OTP has expired
  // Fix: Add 'Z' to ensure UTC parsing if not already present
  const expiresAtString = data.expires_at.endsWith('Z') ? data.expires_at : `${data.expires_at}Z`;
  const expiresAt = new Date(expiresAtString);
  const now = new Date();

  if (now > expiresAt) {
    throw new Error('OTP has expired');
  }

  // Check if max attempts exceeded
  const maxAttempts = parseInt(process.env.OTP_MAX_ATTEMPTS || '3');
  if (data.attempts >= maxAttempts) {
    throw new Error('Maximum verification attempts exceeded');
  }

  // Verify code
  if (data.code !== code) {
    // Increment attempts
    await supabase
      .from('otp')
      .update({ attempts: data.attempts + 1 })
      .eq('id', data.id);

    throw new Error('Invalid OTP code');
  }

  // Mark OTP as verified
  await supabase
    .from('otp')
    .update({ verified: true })
    .eq('id', data.id);

  return true;
};

export const cleanupExpiredOTPs = async (): Promise<void> => {
  await supabase
    .from('otp')
    .delete()
    .lt('expires_at', new Date().toISOString());
};
