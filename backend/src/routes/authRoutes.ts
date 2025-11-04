import { Router } from 'express';
import { body } from 'express-validator';
import express from 'express';
import {
  sendOTPHandler,
  verifyOTPHandler,
  getCurrentUser,
  updateProfile,
  registerUser,
  verifyRegistrationOTP,
  loginUser,
  requestPasswordReset,
  resetPassword,
  savePushToken,
  switchRoleHandler,
} from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';

const router = Router();

// Send OTP
router.post(
  '/send-otp',
  validate([
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('medium')
      .isIn(['email', 'whatsapp'])
      .withMessage('Medium must be either email or whatsapp'),
  ]),
  sendOTPHandler
);

// Verify OTP and authenticate
router.post(
  '/verify-otp',
  validate([
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP code must be 6 digits'),
    body('name').optional(),
  ]),
  verifyOTPHandler
);

// Get current user (protected)
router.get('/me', authenticate, getCurrentUser);

// Update user profile (protected) - 2MB limit for profile images
router.put(
  '/profile',
  express.json({ limit: '2mb' }),
  express.urlencoded({ extended: true, limit: '2mb' }),
  authenticate,
  validate([
    body('name').optional().isString(),
    body('email').optional().custom((value) => {
      // Allow null, empty string, or valid email
      if (value === null || value === undefined || value === '') return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }),
    body('location').optional(),
    body('skill_level').optional(),
    body('gender').optional(),
    body('profile_image').optional(),
  ]),
  updateProfile
);

// Register new user
router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('name').notEmpty().withMessage('Name is required'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ]),
  registerUser
);

// Verify registration OTP
router.post(
  '/verify-registration',
  validate([
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP code must be 6 digits'),
  ]),
  verifyRegistrationOTP
);

// Login existing user
router.post(
  '/login',
  validate([
    body('identifier').notEmpty().withMessage('Email or phone is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  loginUser
);

// Request password reset
router.post(
  '/forgot-password',
  validate([
    body('identifier').notEmpty().withMessage('Email or phone is required'),
  ]),
  requestPasswordReset
);

// Reset password with OTP
router.post(
  '/reset-password',
  validate([
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('code')
      .isLength({ min: 6, max: 6 })
      .withMessage('Reset code must be 6 digits'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
  ]),
  resetPassword
);

// Save push notification token
router.post(
  '/push-token',
  authenticate,
  validate([
    body('pushToken').notEmpty().withMessage('Push token is required'),
  ]),
  savePushToken
);

// Switch user role
router.post(
  '/switch-role',
  authenticate,
  validate([
    body('role').notEmpty().withMessage('Role is required'),
  ]),
  switchRoleHandler
);

export default router;
