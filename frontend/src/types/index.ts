export type UserRole = 'member' | 'manager';

export interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: UserRole;
  profile_image?: string;
  location?: string;
  skill_level?: string;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  manager_id: string;
  location?: string;
  profile_image?: string;
}

export interface Session {
  id: string;
  community_id: string;
  title: string;
  description?: string;
  datetime: string;
  location: string;
  google_maps_url?: string;
  price: number;
  max_players: number;
  booked_count: number;
  status: 'active' | 'cancelled' | 'completed';
  visibility: boolean;
  community_name?: string;
  community_location?: string;
  available_spots?: number;
}

export interface Booking {
  id: string;
  user_id: string;
  session_id: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: string;
  sessions?: Session;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface RegisterData {
  email: string;
  name: string;
  phone: string;
  password: string;
}
