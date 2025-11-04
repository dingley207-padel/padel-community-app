import React, { useState } from 'react';
import { useStripe } from '@stripe/stripe-react-native';
import api from '../services/api';

export const usePaymentSheet = () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [loading, setLoading] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  const initializePaymentSheet = async (sessionId: string) => {
    try {
      setLoading(true);

      // Create payment intent on backend
      const { paymentIntent, paymentIntentId: intentId } = await api.createPaymentIntent(sessionId);

      if (!paymentIntent) {
        throw new Error('Failed to initialize payment');
      }

      // Store the payment intent ID for later confirmation
      setPaymentIntentId(intentId);

      // Initialize the Payment Sheet
      // Apple Pay and Google Pay will automatically appear as options if available
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: paymentIntent,
        merchantDisplayName: 'Love The Padel',
        allowsDelayedPaymentMethods: false,
        returnURL: 'lovethepadel://stripe-redirect',
        applePay: {
          merchantCountryCode: 'AE',
        },
        googlePay: {
          merchantCountryCode: 'AE',
          testEnv: __DEV__,
        },
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        throw new Error(error.message);
      }

      setLoading(false);
      return { success: true, paymentIntentId: intentId };
    } catch (error: any) {
      setLoading(false);
      console.error('Payment sheet initialization error:', error);
      throw error;
    }
  };

  const openPaymentSheet = async () => {
    try {
      setLoading(true);
      const { error } = await presentPaymentSheet();

      if (error) {
        setLoading(false);
        if (error.code === 'Canceled') {
          return { success: false, cancelled: true, paymentIntentId: null };
        }
        throw new Error(error.message);
      }

      setLoading(false);
      return { success: true, cancelled: false, paymentIntentId };
    } catch (error: any) {
      setLoading(false);
      throw error;
    }
  };

  return {
    initializePaymentSheet,
    openPaymentSheet,
    loading,
    paymentIntentId,
  };
};
