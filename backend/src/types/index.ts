import { Request } from 'express';

export type UserRole = 'member' | 'community_manager' | 'super_admin';
export type OTPMedium = 'email' | 'whatsapp';
export type SessionStatus = 'active' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password_hash?: string;
  otp_verified: boolean;
  role: UserRole;
  profile_image?: string;
  location?: string;
  skill_level?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  manager_id: string;
  location?: string;
  profile_image?: string;
  banner_image?: string;
  stripe_account_id?: string;
  website_url?: string;
  twitter_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  facebook_url?: string;
  youtube_url?: string;
  member_count?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  community_id: string;
  title: string;
  description?: string;
  datetime: Date;
  location: string;
  google_maps_url?: string;
  price: number;
  max_players: number;
  booked_count: number;
  status: SessionStatus;
  visibility: boolean;
  free_cancellation_hours?: number;
  allow_conditional_cancellation?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  payment_status: PaymentStatus;
  timestamp: Date;
  cancelled_at?: Date;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  platform_fee: number;
  net_amount: number;
  payment_method?: string;
  status: PaymentStatus;
  stripe_txn_id?: string;
  stripe_payment_intent_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface OTP {
  id: string;
  user_identifier: string;
  code: string;
  medium: OTPMedium;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
  attempts: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    phone?: string;
    role: UserRole;
  };
}

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: UserRole;
}

export interface CreateSessionDTO {
  community_id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  price: number;
  max_players: number;
  visibility?: boolean;
  free_cancellation_hours?: number;
  allow_conditional_cancellation?: boolean;
}

export interface CreateBookingDTO {
  session_id: string;
  payment_method_id: string;
}

export interface SendOTPDTO {
  identifier: string; // email or phone
  medium: OTPMedium;
}

export interface VerifyOTPDTO {
  identifier: string;
  code: string;
  name?: string; // for first-time registration
}

export interface RegisterDTO {
  email: string;
  name: string;
  phone: string;
  password: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  created_at: Date;
}

export interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  community_id?: string;
  assigned_by?: string;
  assigned_at: Date;
}

export interface AssignRoleDTO {
  user_email: string;
  role_name: 'community_manager' | 'super_admin';
  community_id?: string;
}

export interface SendNotificationDTO {
  title: string;
  body: string;
  recipient_type: 'all_community' | 'session_attendees' | 'individual';
  community_id?: string;
  session_id?: string;
  recipient_ids?: string[];
}
