import { supabase } from '../config/database';
import { stripe, PLATFORM_FEE_PERCENT } from '../config/stripe';
import { Booking, Payment } from '../types';
import { notifySpotAvailable, notifyRefundProcessed } from './notificationService';

export const createBooking = async (
  userId: string,
  sessionId: string,
  paymentMethodId: string
): Promise<{ booking: Booking; payment: Payment }> => {
  // Get session details
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, communities!sessions_community_id_fkey(stripe_account_id)')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  // Check if session is available
  if (session.status !== 'active') {
    throw new Error('Session is not available for booking');
  }

  if (session.booked_count >= session.max_players) {
    throw new Error('Session is fully booked');
  }

  // Parse session datetime - ensure it's treated as UTC
  // If the datetime string doesn't have a Z suffix, JavaScript will treat it as local time
  // So we need to ensure it's parsed as UTC
  const sessionDatetime = session.datetime.endsWith('Z') ? session.datetime : session.datetime + 'Z';
  const sessionTime = new Date(sessionDatetime);
  const now = new Date();

  if (sessionTime < now) {
    throw new Error('Cannot book a session in the past');
  }

  // Check if user already booked
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .is('cancelled_at', null)
    .single();

  if (existingBooking) {
    throw new Error('You have already booked this session');
  }

  // Calculate fees
  const amount = parseFloat(session.price.toString());
  const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
  const netAmount = amount - platformFee;

  try {
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never',
      },
      metadata: {
        session_id: sessionId,
        user_id: userId,
      },
      // If using Stripe Connect for payouts
      ...(session.communities?.stripe_account_id && {
        transfer_data: {
          destination: session.communities.stripe_account_id,
          amount: Math.round(netAmount * 100),
        },
      }),
    });

    // Create booking (this will trigger the atomic increment)
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        session_id: sessionId,
        payment_status: 'completed',
      })
      .select()
      .single();

    if (bookingError) {
      // Refund payment if booking fails
      await stripe.refunds.create({
        payment_intent: paymentIntent.id,
      });
      throw new Error(`Failed to create booking: ${bookingError.message}`);
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        amount,
        platform_fee: platformFee,
        net_amount: netAmount,
        payment_method: paymentMethodId,
        status: 'completed',
        stripe_txn_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id,
      })
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Failed to record payment: ${paymentError.message}`);
    }

    return {
      booking: booking as Booking,
      payment: payment as Payment,
    };
  } catch (error: any) {
    console.error('Booking error:', error);
    throw new Error(error.message || 'Failed to process booking');
  }
};

export const getUserBookings = async (userId: string) => {
  console.log('[getUserBookings] Fetching bookings for user:', userId);

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      sessions (
        id,
        title,
        datetime,
        location,
        price,
        status,
        community_id,
        communities!sessions_community_id_fkey (name, location)
      ),
      payments (*)
    `)
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('[getUserBookings] Error:', error);
    throw new Error(`Failed to fetch bookings: ${error.message}`);
  }

  console.log('[getUserBookings] Found bookings:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('[getUserBookings] First booking:', JSON.stringify(data[0], null, 2));
    console.log('[getUserBookings] All booking IDs and session datetimes:');
    data.forEach((booking: any) => {
      console.log(`  - Booking ${booking.id}: Session datetime=${booking.sessions?.datetime}, status=${booking.sessions?.status}, cancelled_at=${booking.cancelled_at}`);
    });
  }

  return data;
};

export const cancelBooking = async (
  bookingId: string,
  userId: string,
  force: boolean = false
): Promise<{ type: 'immediate' | 'pending'; message: string }> => {
  // Get booking details with session info
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('*, sessions(datetime, free_cancellation_hours, allow_conditional_cancellation, price), payments(*)')
    .eq('id', bookingId)
    .eq('user_id', userId)
    .is('cancelled_at', null)
    .single();

  if (bookingError || !booking) {
    throw new Error('Booking not found');
  }

  // Ensure datetime is treated as UTC by adding 'Z' if not present
  const sessionDatetime = booking.sessions.datetime.endsWith('Z')
    ? booking.sessions.datetime
    : booking.sessions.datetime + 'Z';
  const sessionTime = new Date(sessionDatetime);
  const now = new Date();
  const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Debug logging
  console.log('[cancelBooking] Debug info:');
  console.log('  Original datetime:', booking.sessions.datetime);
  console.log('  Parsed datetime:', sessionDatetime);
  console.log('  Session time:', sessionTime.toISOString());
  console.log('  Current time:', now.toISOString());
  console.log('  Hours until session:', hoursUntilSession);

  // Use session-specific cancellation hours or default to 24
  const freeCancellationHours = booking.sessions.free_cancellation_hours || 24;
  const allowConditional = booking.sessions.allow_conditional_cancellation !== false;

  // Within free cancellation window - immediate refund
  if (hoursUntilSession >= freeCancellationHours) {
    // Get session details for notification
    const { data: session } = await supabase
      .from('sessions')
      .select('title, community_id')
      .eq('id', booking.session_id)
      .single();

    // Process full refund
    if (booking.payments && booking.payments.stripe_payment_intent_id) {
      await stripe.refunds.create({
        payment_intent: booking.payments.stripe_payment_intent_id,
      });

      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('booking_id', bookingId);
    }

    // Cancel booking (this will trigger the decrement)
    await supabase
      .from('bookings')
      .update({
        cancelled_at: new Date().toISOString(),
        cancellation_status: 'cancelled',
        refund_status: 'completed',
        refund_amount: booking.sessions.price,
      })
      .eq('id', bookingId);

    // Notify community members about the available spot
    if (session && session.community_id) {
      console.log(`[cancelBooking] Notifying community about spot in "${session.title}"`);
      notifySpotAvailable(
        booking.session_id,
        session.title,
        session.community_id,
        false // Not pending, spot is immediately available
      ).catch(err => console.error('Notification error:', err));
    }

    return {
      type: 'immediate',
      message: `Booking cancelled successfully. Full refund of AED ${booking.sessions.price} has been processed.`,
    };
  }

  // Outside free cancellation window
  if (hoursUntilSession < 0) {
    throw new Error('Cannot cancel a session that has already started');
  }

  if (!allowConditional && !force) {
    throw new Error(
      `Free cancellation period has ended. Cancellations must be made at least ${freeCancellationHours} hours before the session.`
    );
  }

  // Get session details for notification
  const { data: session } = await supabase
    .from('sessions')
    .select('title, community_id')
    .eq('id', booking.session_id)
    .single();

  // Conditional cancellation - pending replacement
  await supabase
    .from('bookings')
    .update({
      cancellation_status: 'pending_replacement',
      cancellation_requested_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  // Notify community members that a spot may become available
  if (session && session.community_id) {
    console.log(`[cancelBooking] Notifying community about potential spot in "${session.title}"`);
    notifySpotAvailable(
      booking.session_id,
      session.title,
      session.community_id,
      true // Pending - spot will be available if someone books
    ).catch(err => console.error('Notification error:', err));
  }

  return {
    type: 'pending',
    message: `Cancellation request submitted. You will receive a full refund of AED ${booking.sessions.price} if someone takes your spot. Otherwise, no refund will be issued.`,
  };
};

// New function to handle someone taking a pending cancellation spot
export const takePendingCancellationSpot = async (
  bookingId: string,
  newUserId: string,
  paymentMethodId: string
): Promise<{ booking: Booking; payment: Payment }> => {
  // Get the pending cancellation booking
  const { data: oldBooking, error: oldBookingError } = await supabase
    .from('bookings')
    .select('*, sessions(*, communities!sessions_community_id_fkey(stripe_account_id)), payments(*)')
    .eq('id', bookingId)
    .eq('cancellation_status', 'pending_replacement')
    .single();

  if (oldBookingError || !oldBooking) {
    throw new Error('No pending cancellation found for this booking');
  }

  const session = oldBooking.sessions;
  const amount = parseFloat(session.price.toString());
  const platformFee = (amount * PLATFORM_FEE_PERCENT) / 100;
  const netAmount = amount - platformFee;

  // Create payment for new user
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: 'never',
    },
    metadata: {
      session_id: session.id,
      user_id: newUserId,
      replaces_booking_id: bookingId,
    },
    ...(session.communities?.stripe_account_id && {
      transfer_data: {
        destination: session.communities.stripe_account_id,
        amount: Math.round(netAmount * 100),
      },
    }),
  });

  // Create new booking for replacement user
  const { data: newBooking, error: newBookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: newUserId,
      session_id: session.id,
      payment_status: 'completed',
    })
    .select()
    .single();

  if (newBookingError) {
    // Refund new user if booking fails
    await stripe.refunds.create({
      payment_intent: paymentIntent.id,
    });
    throw new Error(`Failed to create booking: ${newBookingError.message}`);
  }

  // Create payment record for new user
  const { data: newPayment, error: newPaymentError } = await supabase
    .from('payments')
    .insert({
      booking_id: newBooking.id,
      amount,
      platform_fee: platformFee,
      net_amount: netAmount,
      payment_method: paymentMethodId,
      status: 'completed',
      stripe_txn_id: paymentIntent.id,
      stripe_payment_intent_id: paymentIntent.id,
    })
    .select()
    .single();

  if (newPaymentError) {
    throw new Error(`Failed to record payment: ${newPaymentError.message}`);
  }

  // Refund original user
  if (oldBooking.payments && oldBooking.payments.stripe_payment_intent_id) {
    await stripe.refunds.create({
      payment_intent: oldBooking.payments.stripe_payment_intent_id,
    });

    await supabase
      .from('payments')
      .update({ status: 'refunded' })
      .eq('booking_id', bookingId);
  }

  // Cancel old booking and link to new user
  await supabase
    .from('bookings')
    .update({
      cancelled_at: new Date().toISOString(),
      cancellation_status: 'cancelled',
      refund_status: 'completed',
      refund_amount: amount,
      replaced_by_user_id: newUserId,
    })
    .eq('id', bookingId);

  // Notify original user that their refund has been processed
  console.log(`[takePendingSpot] Notifying user ${oldBooking.user_id} about refund`);
  notifyRefundProcessed(
    oldBooking.user_id,
    session.title,
    amount
  ).catch(err => console.error('Notification error:', err));

  // Note: booked_count stays the same since it's a replacement, not increment

  return {
    booking: newBooking as Booking,
    payment: newPayment as Payment,
  };
};
