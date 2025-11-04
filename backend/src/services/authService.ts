import { supabase } from '../config/database';
import { generateToken } from '../utils/jwt';
import { User, UserRole } from '../types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const findOrCreateUser = async (
  identifier: string,
  name?: string
): Promise<User> => {
  // Check if user exists (by email or phone)
  const isEmail = identifier.includes('@');
  const field = isEmail ? 'email' : 'phone';

  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq(field, identifier)
    .single();

  if (existingUser) {
    // Update otp_verified to true
    const { data: updatedUser } = await supabase
      .from('users')
      .update({ otp_verified: true })
      .eq('id', existingUser.id)
      .select()
      .single();

    return updatedUser as User;
  }

  // Create new user
  const newUserData: any = {
    [field]: identifier,
    name: name || 'New User',
    otp_verified: true,
    role: 'member' as UserRole,
  };

  const { data: newUser, error } = await supabase
    .from('users')
    .insert(newUserData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return newUser as User;
};

export const generateAuthToken = (user: User): string => {
  return generateToken({
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
  });
};

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as User;
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<User> => {
  console.log('[updateUserProfile] Starting update for user:', userId);
  console.log('[updateUserProfile] Update fields:', Object.keys(updates));
  if (updates.profile_image) {
    console.log('[updateUserProfile] Profile image size:', Math.round(updates.profile_image.length / 1024), 'KB');
  }

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('[updateUserProfile] Database error:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }

  console.log('[updateUserProfile] Update successful');
  return data as User;
};

export const createUserWithPassword = async (
  email: string,
  name: string,
  phone: string,
  password: string
): Promise<User> => {
  // Hash the password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create new user with all required fields
  const newUserData = {
    email,
    name,
    phone,
    password_hash,
    otp_verified: false, // Will be verified after OTP confirmation
    role: 'member' as UserRole,
  };

  const { data: newUser, error } = await supabase
    .from('users')
    .insert(newUserData)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  return newUser as User;
};

export const verifyPassword = async (
  identifier: string,
  password: string
): Promise<User | null> => {
  // Check if user exists (by email or phone)
  const isEmail = identifier.includes('@');
  const field = isEmail ? 'email' : 'phone';

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq(field, identifier)
    .single();

  if (!user || !user.password_hash) {
    return null;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password_hash);

  if (!isValid) {
    return null;
  }

  return user as User;
};

export const getUserByIdentifier = async (identifier: string): Promise<User | null> => {
  const isEmail = identifier.includes('@');
  const field = isEmail ? 'email' : 'phone';

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq(field, identifier)
    .single();

  if (error) {
    return null;
  }

  return data as User;
};

export const markUserAsVerified = async (userId: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({ otp_verified: true })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to verify user: ${error.message}`);
  }

  return data as User;
};

export const updatePushToken = async (userId: string, pushToken: string): Promise<User> => {
  const { data, error } = await supabase
    .from('users')
    .update({ push_token: pushToken })
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update push token: ${error.message}`);
  }

  return data as User;
};

// Pending Registrations Functions

interface PendingRegistration {
  id: string;
  email: string;
  name: string;
  phone: string;
  password_hash: string;
  created_at: string;
  expires_at: string;
}

const PENDING_REGISTRATION_EXPIRY_MINUTES = 15;

export const createPendingRegistration = async (
  email: string,
  name: string,
  phone: string,
  password: string
): Promise<PendingRegistration> => {
  // Hash the password
  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  // Calculate expiry time (15 minutes from now)
  const expiresAt = new Date(Date.now() + PENDING_REGISTRATION_EXPIRY_MINUTES * 60 * 1000);

  // Check if there's an existing pending registration with this email or phone
  const { data: existingReg } = await supabase
    .from('pending_registrations')
    .select('*')
    .or(`email.eq.${email},phone.eq.${phone}`)
    .single();

  let data, error;

  if (existingReg) {
    // Update the existing pending registration instead of deleting it
    console.log(`⚠️  Updating existing pending registration for ${email} (was created at ${existingReg.created_at})`);

    const { data: updateData, error: updateError } = await supabase
      .from('pending_registrations')
      .update({
        email,
        name,
        phone,
        password_hash,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(), // Reset creation time
      })
      .eq('id', existingReg.id)
      .select()
      .single();

    data = updateData;
    error = updateError;
  } else {
    // Create new pending registration
    const { data: insertData, error: insertError } = await supabase
      .from('pending_registrations')
      .insert({
        email,
        name,
        phone,
        password_hash,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    data = insertData;
    error = insertError;
  }

  if (error) {
    throw new Error(`Failed to create pending registration: ${error.message}`);
  }

  return data as PendingRegistration;
};

export const getPendingRegistration = async (phone: string): Promise<PendingRegistration | null> => {
  console.log(`[getPendingRegistration] Searching for phone: ${phone}`);

  const { data, error } = await supabase
    .from('pending_registrations')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error) {
    console.log(`[getPendingRegistration] Database error for ${phone}:`, error.message);
    console.log(`[getPendingRegistration] Error code:`, error.code);
    console.log(`[getPendingRegistration] Full error:`, JSON.stringify(error, null, 2));
    return null;
  }

  console.log(`[getPendingRegistration] Found registration:`, {
    email: data.email,
    phone: data.phone,
    created_at: data.created_at,
    expires_at: data.expires_at
  });

  // Check if expired
  // Fix: Add 'Z' to ensure UTC parsing if not already present
  const expiresAtString = data.expires_at.endsWith('Z') ? data.expires_at : `${data.expires_at}Z`;
  const expiresAt = new Date(expiresAtString);
  const now = new Date();
  console.log(`[getPendingRegistration] Expiry check:`);
  console.log(`  - Original expires_at: ${data.expires_at}`);
  console.log(`  - Fixed expires_at: ${expiresAtString}`);
  console.log(`  - Expires at: ${expiresAt.toISOString()} (${expiresAt.getTime()})`);
  console.log(`  - Current time: ${now.toISOString()} (${now.getTime()})`);
  console.log(`  - Time diff (ms): ${expiresAt.getTime() - now.getTime()}`);
  console.log(`  - Is expired: ${now > expiresAt}`);

  if (now > expiresAt) {
    console.log(`[getPendingRegistration] Registration expired, deleting...`);
    // Delete expired registration
    await supabase.from('pending_registrations').delete().eq('id', data.id);
    return null;
  }

  console.log(`[getPendingRegistration] ✅ Returning valid registration for ${phone}`);
  return data as PendingRegistration;
};

export const createUserFromPendingRegistration = async (
  pendingReg: PendingRegistration
): Promise<User> => {
  // Create the actual user
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      email: pendingReg.email,
      name: pendingReg.name,
      phone: pendingReg.phone,
      password_hash: pendingReg.password_hash,
      otp_verified: true, // They just verified via OTP
      role: 'member' as UserRole,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }

  // Delete the pending registration
  await supabase.from('pending_registrations').delete().eq('id', pendingReg.id);

  return newUser as User;
};

export const deletePendingRegistration = async (phone: string): Promise<void> => {
  await supabase.from('pending_registrations').delete().eq('phone', phone);
};

export const cleanupExpiredPendingRegistrations = async (): Promise<void> => {
  const now = new Date().toISOString();
  await supabase.from('pending_registrations').delete().lt('expires_at', now);
};
