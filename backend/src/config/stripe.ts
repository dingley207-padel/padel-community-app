import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('Missing Stripe secret key. Please check your .env file.');
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover' as any,
  typescript: true,
});

export const PLATFORM_FEE_PERCENT = parseFloat(process.env.STRIPE_PLATFORM_FEE_PERCENT || '7.5');

export default stripe;
