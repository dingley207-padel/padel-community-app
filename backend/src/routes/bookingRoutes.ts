import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBookingHandler,
  getUserBookingsHandler,
  cancelBookingHandler,
  takePendingSpotHandler,
  createPaymentIntentHandler,
  confirmBookingAfterPaymentHandler,
} from '../controllers/bookingController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Get user's bookings
router.get('/', authenticate, getUserBookingsHandler);

// Create payment intent for booking
router.post(
  '/create-payment-intent',
  authenticate,
  validate([
    body('session_id').isUUID().withMessage('Valid session ID is required'),
  ]),
  createPaymentIntentHandler
);

// Confirm booking after payment (for Payment Sheet flow)
router.post(
  '/confirm-booking',
  authenticate,
  validate([
    body('session_id').isUUID().withMessage('Valid session ID is required'),
    body('payment_intent_id')
      .notEmpty()
      .withMessage('Payment intent ID is required'),
  ]),
  confirmBookingAfterPaymentHandler
);

// Create booking (legacy flow - direct payment method)
router.post(
  '/',
  authenticate,
  validate([
    body('session_id').isUUID().withMessage('Valid session ID is required'),
    body('payment_method_id')
      .notEmpty()
      .withMessage('Payment method ID is required'),
  ]),
  createBookingHandler
);

// Cancel booking
router.delete('/:id', authenticate, cancelBookingHandler);

// Take a pending cancellation spot
router.post(
  '/:id/take-spot',
  authenticate,
  validate([
    body('payment_method_id')
      .notEmpty()
      .withMessage('Payment method ID is required'),
  ]),
  takePendingSpotHandler
);

export default router;

