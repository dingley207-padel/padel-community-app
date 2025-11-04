import { Request, Response } from 'express';
import { sendOTP, verifyOTP } from '../services/otpService';
import {
  findOrCreateUser,
  generateAuthToken,
  getUserById,
  updateUserProfile,
  getUserByIdentifier,
  markUserAsVerified,
  verifyPassword,
  updatePushToken,
  createPendingRegistration,
  getPendingRegistration,
  createUserFromPendingRegistration,
  cleanupExpiredPendingRegistrations
} from '../services/authService';
import { isValidEmail, isValidPhone } from '../utils/otp';
import { AuthRequest, RegisterDTO } from '../types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const sendOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, medium } = req.body;

    // Validate identifier format
    if (medium === 'email' && !isValidEmail(identifier)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (medium === 'whatsapp' && !isValidPhone(identifier)) {
      res.status(400).json({
        error: 'Invalid phone format. Use E.164 format (e.g., +1234567890)',
      });
      return;
    }

    await sendOTP(identifier, medium);

    res.status(200).json({
      message: 'OTP sent successfully',
      medium,
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: error.message || 'Failed to send OTP' });
  }
};

export const verifyOTPHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, code, name } = req.body;

    // Verify OTP
    const isValid = await verifyOTP(identifier, code);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    // Find or create user
    const user = await findOrCreateUser(identifier, name);

    // Generate JWT token
    const token = generateAuthToken(user);

    res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
      },
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(400).json({ error: error.message || 'OTP verification failed' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        location: user.location,
        skill_level: user.skill_level,
      },
    });
  } catch (error: any) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const updates = req.body;

    // Prevent updating sensitive fields
    delete updates.id;
    delete updates.otp_verified;
    delete updates.created_at;
    delete updates.updated_at;
    delete updates.password_hash;

    const user = await updateUserProfile(req.user.id, updates);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        location: user.location,
        skill_level: user.skill_level,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, phone, password }: RegisterDTO = req.body;

    // Validate input
    if (!email || !name || !phone || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    if (!isValidPhone(phone)) {
      res.status(400).json({
        error: 'Invalid phone format. Use E.164 format (e.g., +1234567890)',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user already exists (only check verified users in main users table)
    const existingUser = await getUserByIdentifier(email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists. Please login or use a different email.' });
      return;
    }

    const existingPhoneUser = await getUserByIdentifier(phone);
    if (existingPhoneUser) {
      res.status(400).json({ error: 'User with this phone number already exists. Please login or use a different phone.' });
      return;
    }

    // Clean up any expired pending registrations
    await cleanupExpiredPendingRegistrations();

    // Create pending registration (user NOT created yet - only after OTP verification)
    await createPendingRegistration(email, name, phone, password);

    console.log(`✅ Pending registration created for ${email}. User will be created after OTP verification.`);

    res.status(201).json({
      message: 'Registration initiated. Please verify your phone number to complete registration.',
      phone: phone,
      expires_in_minutes: 15,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Registration failed' });
  }
};

export const verifyRegistrationOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    console.log(`[verifyRegistrationOTP] Verification attempt for phone: ${phone}, code: ${code}`);

    if (!phone || !code) {
      console.log(`[verifyRegistrationOTP] Missing phone or code`);
      res.status(400).json({ error: 'Phone and code are required' });
      return;
    }

    // Verify OTP
    console.log(`[verifyRegistrationOTP] Verifying OTP...`);
    const isValid = await verifyOTP(phone, code);

    if (!isValid) {
      console.log(`[verifyRegistrationOTP] OTP verification failed for ${phone}`);
      res.status(400).json({ error: 'Invalid or expired OTP code' });
      return;
    }

    console.log(`[verifyRegistrationOTP] OTP verified successfully for ${phone}`);

    // Check if there's a pending registration for this phone
    console.log(`[verifyRegistrationOTP] Looking for pending registration...`);
    const pendingReg = await getPendingRegistration(phone);

    if (pendingReg) {
      // NEW FLOW: Create user from pending registration
      console.log(`✅ OTP verified. Creating user from pending registration for ${phone}`);

      const newUser = await createUserFromPendingRegistration(pendingReg);

      // Generate JWT token
      const token = generateAuthToken(newUser);

      res.status(200).json({
        message: 'Registration completed successfully! Welcome!',
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          profile_image: newUser.profile_image,
          location: newUser.location,
          skill_level: newUser.skill_level,
        },
      });
      return;
    }

    // OLD FLOW: Handle existing users (backward compatibility)
    // This handles users who were created before the pending registration system
    const user = await getUserByIdentifier(phone);

    if (!user) {
      res.status(404).json({ error: 'No pending registration found for this phone number' });
      return;
    }

    // Mark user as verified
    const verifiedUser = await markUserAsVerified(user.id);

    // Generate JWT token
    const token = generateAuthToken(verifiedUser);

    res.status(200).json({
      message: 'Phone verified successfully',
      token,
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        phone: verifiedUser.phone,
        role: verifiedUser.role,
        profile_image: verifiedUser.profile_image,
        location: verifiedUser.location,
        skill_level: verifiedUser.skill_level,
      },
    });
  } catch (error: any) {
    console.error('Verify registration OTP error:', error);
    res.status(400).json({ error: error.message || 'OTP verification failed' });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/phone and password are required' });
      return;
    }

    // Verify password
    const user = await verifyPassword(identifier.trim(), password);

    if (!user) {
      res.status(401).json({ error: 'Invalid email/phone or password' });
      return;
    }

    // Check if user is verified
    if (!user.otp_verified) {
      res.status(403).json({ error: 'Please verify your phone number first' });
      return;
    }

    // Generate JWT token
    const token = generateAuthToken(user);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile_image: user.profile_image,
        location: user.location,
        skill_level: user.skill_level,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      res.status(400).json({ error: 'Email or phone is required' });
      return;
    }

    // Check if user exists
    const user = await getUserByIdentifier(identifier.trim());

    if (!user) {
      // Don't reveal if user exists or not for security
      res.status(200).json({
        message: 'If an account exists, a reset code will be sent',
      });
      return;
    }

    // Send OTP to phone via WhatsApp
    if (user.phone) {
      await sendOTP(user.phone, 'whatsapp');
      res.status(200).json({
        message: 'Reset code sent to your phone via WhatsApp',
        phone: user.phone,
      });
    } else {
      res.status(400).json({ error: 'No phone number associated with this account' });
    }
  } catch (error: any) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: error.message || 'Failed to request password reset' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code, newPassword } = req.body;

    if (!phone || !code || !newPassword) {
      res.status(400).json({ error: 'Phone, code, and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Verify OTP
    const isValid = await verifyOTP(phone, code);

    if (!isValid) {
      res.status(400).json({ error: 'Invalid or expired reset code' });
      return;
    }

    // Get user by phone
    const user = await getUserByIdentifier(phone);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await updateUserProfile(user.id, { password_hash });

    res.status(200).json({
      message: 'Password reset successful. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: error.message || 'Password reset failed' });
  }
};

export const savePushToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { pushToken } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!pushToken) {
      res.status(400).json({ error: 'Push token is required' });
      return;
    }

    console.log(`Saving push token for user ${userId}:`, pushToken);

    const updatedUser = await updatePushToken(userId, pushToken);

    res.status(200).json({
      message: 'Push token saved successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Save push token error:', error);
    res.status(400).json({ error: error.message || 'Failed to save push token' });
  }
};

export const switchRoleHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { role } = req.body;

    if (!role) {
      res.status(400).json({ error: 'Role is required' });
      return;
    }

    console.log(`[switchRole] User ${req.user.id} switching to role: ${role}`);

    // Get the full user object
    const user = await getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify the user has this role
    // Special case: everyone can switch to 'member' role
    if (role !== 'member') {
      const { supabase } = require('../config/database');
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', req.user.id);

      if (rolesError) {
        throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
      }

      const hasRole = userRoles && userRoles.some((r: any) => r.roles?.name === role);

      if (!hasRole) {
        res.status(403).json({ error: 'You do not have access to this role' });
        return;
      }
    }

    // Generate new token with the selected role
    const { generateToken } = require('../utils/jwt');
    const token = generateToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: role, // Use the selected role
    });

    console.log(`[switchRole] New token generated for user ${req.user.id} with role: ${role}`);

    res.status(200).json({
      message: 'Role switched successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: role,
      },
    });
  } catch (error: any) {
    console.error('Switch role error:', error);
    res.status(400).json({ error: error.message || 'Failed to switch role' });
  }
};
