import { Response } from 'express';
import {
  createBooking,
  getUserBookings,
  cancelBooking,
  takePendingCancellationSpot,
} from '../services/bookingService';
import { AuthRequest } from '../types';
import { stripe, PLATFORM_FEE_PERCENT } from '../config/stripe';
import { supabase } from '../config/database';

export const createBookingHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { session_id, payment_method_id } = req.body;

    const result = await createBooking(req.user.id, session_id, payment_method_id);

    res.status(201).json({
      message: 'Booking successful',
      booking: result.booking,
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(400).json({ error: error.message || 'Failed to create booking' });
  }
};

export const getUserBookingsHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const bookings = await getUserBookings(req.user.id);

    res.status(200).json({ bookings });
  } catch (error: any) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch bookings' });
  }
};

export const cancelBookingHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { force } = req.body; // Optional force parameter

    const result = await cancelBooking(id, req.user.id, force);

    res.status(200).json({
      ...result,
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(400).json({ error: error.message || 'Failed to cancel booking' });
  }
};

export const takePendingSpotHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { id } = req.params; // booking ID with pending cancellation
    const { payment_method_id } = req.body;

    const result = await takePendingCancellationSpot(id, req.user.id, payment_method_id);

    res.status(201).json({
      message: 'Successfully claimed the spot!',
      booking: result.booking,
      payment: result.payment,
    });
  } catch (error: any) {
    console.error('Take pending spot error:', error);
    res.status(400).json({ error: error.message || 'Failed to claim spot' });
  }
};

export const createPaymentIntentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { session_id } = req.body;

    // Get session details
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, communities!sessions_community_id_fkey(stripe_account_id)')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if session is available
    if (session.status !== 'active') {
      res.status(400).json({ error: 'Session is not available for booking' });
      return;
    }

    if (session.booked_count >= session.max_players) {
      res.status(400).json({ error: 'Session is fully booked' });
      return;
    }

    // Calculate fees
    const amount = parseFloat(session.price.toString());
    const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
    const netAmount = amount - platformFee;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'aed', // UAE Dirham
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        session_id: session_id,
        user_id: req.user.id,
        session_title: session.title,
      },
      // If using Stripe Connect for payouts
      ...(session.communities?.stripe_account_id && {
        transfer_data: {
          destination: session.communities.stripe_account_id,
          amount: Math.round(netAmount * 100),
        },
      }),
    });

    res.status(200).json({
      paymentIntent: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      ephemeralKey: null, // Not needed for React Native
      customer: null, // Can add customer support later
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error: any) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
};

export const confirmBookingAfterPaymentHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { session_id, payment_intent_id } = req.body;

    // Verify payment intent status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);

    if (paymentIntent.status !== 'succeeded') {
      res.status(400).json({ error: 'Payment not completed' });
      return;
    }

    // Verify payment intent metadata matches
    if (paymentIntent.metadata.session_id !== session_id ||
        paymentIntent.metadata.user_id !== req.user.id) {
      res.status(400).json({ error: 'Payment intent does not match session or user' });
      return;
    }

    // Get session details
    const { data: session, error: sessionError} = await supabase
      .from('sessions')
      .select('*, communities!sessions_community_id_fkey(stripe_account_id)')
      .eq('id', session_id)
      .single();

    if (sessionError || !session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if user already booked
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('session_id', session_id)
      .is('cancelled_at', null)
      .single();

    if (existingBooking) {
      res.status(400).json({ error: 'You have already booked this session' });
      return;
    }

    // Calculate fees
    const amount = parseFloat(session.price.toString());
    const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
    const netAmount = amount - platformFee;

    // Create booking (this will trigger the atomic increment)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: req.user.id,
        session_id: session_id,
        payment_status: 'completed',
      })
      .select()
      .single();

    if (bookingError) {
      // Refund payment if booking fails
      await stripe.refunds.create({
        payment_intent: payment_intent_id,
      });
      res.status(500).json({ error: `Failed to create booking: ${bookingError.message}` });
      return;
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        payment_method: 'payment_sheet',
        status: 'completed',
        stripe_txn_id: payment_intent_id,
        stripe_payment_intent_id: payment_intent_id,
      })
      .select()
      .single();

    if (paymentError) {
      res.status(500).json({ error: `Failed to record payment: ${paymentError.message}` });
      return;
    }

    res.status(201).json({
      booking,
      payment,
      message: 'Booking created successfully',
    });
  } catch (error: any) {
    console.error('Confirm booking error:', error);
    res.status(500).json({ error: error.message || 'Failed to confirm booking' });
  }
};
