# Complete Sports Community App - Technical Specification

## Executive Summary
Build a comprehensive mobile application for managing sports communities (Tennis, Padel, Pickleball, etc.) with session booking, payments, chat, and community management features. This app allows community managers to create and manage sports venues, schedule sessions, and handle payments, while members can join communities, book sessions, chat with other members, and manage their profiles.

---

## Tech Stack

### Frontend (React Native + Expo)
```json
{
  "framework": "Expo SDK ~54",
  "language": "TypeScript",
  "navigation": "@react-navigation/native + bottom-tabs + native-stack",
  "state": "React Context API",
  "styling": "Apple Design System (custom implementation)",
  "payments": "@stripe/stripe-react-native",
  "networking": "axios",
  "storage": "@react-native-async-storage/async-storage + expo-secure-store",
  "notifications": "expo-notifications + Push Notifications",
  "auth": "expo-local-authentication (PIN + Biometric)",
  "images": "expo-image-picker + expo-image-manipulator",
  "updates": "expo-updates (OTA updates)"
}
```

### Backend (Node.js + Express)
```json
{
  "runtime": "Node.js",
  "framework": "Express.js",
  "language": "TypeScript",
  "database": "Supabase (PostgreSQL)",
  "auth": "JWT (jsonwebtoken)",
  "payments": "Stripe API",
  "sms": "Twilio (WhatsApp OTP)",
  "email": "Nodemailer",
  "notifications": "expo-server-sdk + APNs",
  "validation": "express-validator",
  "hosting": "Railway (auto-deploy from GitHub)"
}
```

### Database (Supabase/PostgreSQL)
```
Schema: 15+ tables with relationships, RLS policies, triggers
```

---

## Core Features & User Flows

### 1. Authentication & Onboarding

#### Registration Flow
1. **Initial Screen**: Choice between "Create Account" or "Sign In"
2. **Registration Form**:
   - Full Name (text input)
   - Email (email validation)
   - Phone Number (E.164 format, e.g., +971501234567)
   - Password (min 8 chars)
   - Confirm Password (must match)
3. **WhatsApp OTP Verification**:
   - Send 6-digit code via Twilio WhatsApp Business API
   - Use approved Meta WhatsApp template with "Copy Code" button
   - Code expires after 10 minutes
   - User enters code to verify phone
4. **PIN Setup** (after verification):
   - Create 4-6 digit PIN
   - Confirm PIN
   - Optional: Enable biometric authentication (Face ID/Touch ID)
5. **Auto-Login**: Store JWT token and user data locally

#### Login Flow
1. **Login Form**:
   - Email or Phone
   - Password
2. **PIN/Biometric Quick Login**:
   - If user has PIN enabled, show quick login screen
   - Option to use biometric if enabled
   - Validate token with backend to ensure user still exists
   - Handle deleted users: clear all local data (token, PIN, biometric)

#### Password Reset Flow
1. Enter email/phone
2. Receive WhatsApp OTP
3. Verify OTP
4. Set new password

#### Technical Implementation
```typescript
// Auth Context manages global auth state
interface AuthContext {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  userRoles: UserRole[];
  selectedRole: string;
  isSuperAdmin: boolean;
  isCommunityManager: boolean;
  
  login: (authData: AuthResponse, skipPinSetup?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  selectRole: (role: string) => void;
}

// API Endpoints
POST /api/auth/register - Create pending registration
POST /api/auth/send-otp - Send WhatsApp OTP
POST /api/auth/verify-registration - Verify OTP and create user
POST /api/auth/login - Login with email/phone + password
POST /api/auth/forgot-password - Request password reset
POST /api/auth/reset-password - Reset password with OTP
GET /api/auth/me - Get current user (requires JWT)
PUT /api/auth/profile - Update profile
POST /api/auth/push-token - Save push notification token
```

---

### 2. User Roles & Permissions

#### Role Types
1. **Member** (default): Join communities, book sessions, chat, view content
2. **Community Manager**: Create/manage communities, create sessions, manage members, send announcements
3. **Super Admin**: Manage all communities, assign manager roles, view all data

#### Role Assignment
- Users can have multiple roles across different communities
- Role switching: Users select active role from bottom tab
- Backend validates role permissions on every protected route

#### Technical Implementation
```typescript
// Database: user_roles table
interface UserRole {
  id: string;
  user_id: string;
  role_name: 'member' | 'community_manager' | 'super_admin';
  community_id: string | null; // null for super_admin
  created_at: string;
}

// Middleware: Protect routes by role
authenticate(req, res, next) // Verify JWT
authorize(['community_manager', 'super_admin']) // Check role
checkCommunityAccess(req, res, next) // Verify community ownership
```

---

### 3. Communities System

#### Community Structure
```typescript
interface Community {
  id: string;
  name: string;
  description: string;
  location: string;
  owner_id: string; // User who created it
  logo: string | null; // Base64 or URL
  membership_fee: number; // Stripe price in cents
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Social media links
  instagram_url: string | null;
  facebook_url: string | null;
  x_url: string | null;
  website_url: string | null;
}
```

#### Sub-Communities
- Communities can have sub-groups (e.g., "Beginners", "Advanced", "Ladies")
- Each sub-community has its own sessions and members
- Separate announcement channels

```typescript
interface SubCommunity {
  id: string;
  community_id: string;
  name: string;
  description: string;
  image: string | null;
  created_at: string;
}
```

#### Community Features
1. **Discovery**: Browse all public communities
2. **Join Community**: Pay membership fee via Stripe
3. **Community Profile**: View details, sessions, members, announcements
4. **Leave Community**: Unsubscribe (no refund)
5. **Manager Dashboard**: Analytics, member management, session creation

#### API Endpoints
```
GET /api/communities - List all communities
GET /api/communities/:id - Get community details
POST /api/communities - Create community (manager only)
PUT /api/communities/:id - Update community (manager only)
DELETE /api/communities/:id - Delete community (manager only)
POST /api/communities/:id/join - Join community (payment required)
POST /api/communities/:id/leave - Leave community
GET /api/communities/:id/members - List members
GET /api/communities/:id/sessions - List sessions
GET /api/communities/:id/sub-communities - List sub-communities
```

---

### 4. Sessions (Booking System)

#### Session Structure
```typescript
interface Session {
  id: string;
  community_id: string;
  sub_community_id: string | null;
  title: string;
  description: string;
  location: string;
  date: string; // ISO date
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  duration_minutes: number;
  max_participants: number;
  current_participants: number;
  price: number; // Stripe price in cents
  stripe_price_id: string | null;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'all' | null;
  gender_restriction: 'male' | 'female' | 'mixed' | null;
  status: 'upcoming' | 'completed' | 'cancelled';
  created_by: string; // User ID
  created_at: string;
}
```

#### Session Templates
- Managers can create reusable session templates
- Bulk publish sessions from templates (e.g., "Every Monday for 8 weeks")
- Templates include: title, description, location, time, duration, price, skill level

```typescript
interface SessionTemplate {
  id: string;
  community_id: string;
  sub_community_id: string | null;
  title: string;
  description: string;
  location: string;
  start_time: string;
  duration_minutes: number;
  max_participants: number;
  price: number;
  skill_level: string | null;
  gender_restriction: string | null;
  created_by: string;
}
```

#### Booking Flow
1. **Browse Sessions**: Filter by date, skill level, community
2. **Session Details**: View full info, attendees list, location
3. **Book Session**: Pay via Stripe (card or Apple Pay)
4. **Confirmation**: Receive booking confirmation + push notification
5. **Attend Session**: Check-in on the day
6. **Completion**: Session marked complete after end time

#### Manager Features
1. **Create Session**: Manual or from template
2. **Edit Session**: Update details (notifies attendees)
3. **Cancel Session**: Refund all attendees automatically
4. **View Attendees**: See who's booked
5. **Send Notifications**: Push notifications to attendees
6. **Bulk Publish**: Create multiple sessions from template

#### API Endpoints
```
GET /api/sessions - List sessions (filter by community, date, user bookings)
GET /api/sessions/:id - Get session details
POST /api/sessions - Create session (manager only)
PUT /api/sessions/:id - Update session (manager only)
DELETE /api/sessions/:id - Cancel session + refund (manager only)
POST /api/sessions/:id/book - Book session (payment required)
POST /api/sessions/:id/cancel-booking - Cancel booking + refund
GET /api/sessions/:id/attendees - List attendees
POST /api/sessions/:id/notify - Send push notification to attendees

GET /api/session-templates - List templates
POST /api/session-templates - Create template
POST /api/session-templates/:id/publish - Bulk publish sessions from template
```

---

### 5. Payments (Stripe Integration)

#### Payment Types
1. **Community Membership**: One-time fee to join
2. **Session Booking**: Per-session payment
3. **Refunds**: Automatic when session cancelled or booking cancelled

#### Stripe Implementation
```typescript
// Backend: Stripe setup
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: price, // cents
  currency: 'aed', // or 'usd'
  metadata: {
    user_id: userId,
    session_id: sessionId,
    type: 'session_booking'
  }
});

// Frontend: Stripe React Native
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

const { initPaymentSheet, presentPaymentSheet } = useStripe();

// Initialize payment sheet
await initPaymentSheet({
  paymentIntentClientSecret: clientSecret,
  merchantDisplayName: 'Padel ONE',
  applePay: {
    merchantCountryCode: 'AE'
  }
});

// Present payment sheet
const { error } = await presentPaymentSheet();
```

#### Order Tracking
```typescript
interface Order {
  id: string;
  user_id: string;
  session_id: string | null;
  community_id: string | null;
  type: 'session' | 'membership';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  stripe_payment_intent_id: string;
  created_at: string;
}
```

#### Refund Logic
- Session cancelled by manager: Refund all bookings
- User cancels booking: Refund if >24 hours before session
- Automatic refund via Stripe API

---

### 6. Chat System

#### Chat Structure
```typescript
interface ChatMessage {
  id: string;
  community_id: string;
  sub_community_id: string | null;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}
```

#### Chat Features
1. **Community Chat**: All members can chat
2. **Sub-Community Chat**: Separate channels for sub-groups
3. **Real-time Updates**: Poll every 3 seconds for new messages
4. **User Presence**: Show member names
5. **Scroll Behavior**: Auto-scroll to bottom on new messages

#### Technical Implementation
```typescript
// API Endpoints
GET /api/chat/:communityId/messages - Get messages (query: subCommunityId, limit, offset)
POST /api/chat/:communityId/messages - Send message

// Frontend: Auto-refresh every 3 seconds
useEffect(() => {
  const interval = setInterval(fetchMessages, 3000);
  return () => clearInterval(interval);
}, []);
```

---

### 7. Announcements System

#### Announcement Structure
```typescript
interface Announcement {
  id: string;
  community_id: string;
  sub_community_id: string | null;
  title: string;
  message: string;
  created_by: string;
  created_at: string;
}
```

#### Features
1. **Manager Creates**: Send to entire community or sub-community
2. **Push Notifications**: All members receive notification
3. **In-App View**: List of announcements with timestamps
4. **Priority Display**: Show in community profile

---

### 8. Friendships System

#### Friendship Structure
```typescript
interface Friendship {
  id: string;
  user_id: string; // Who sent request
  friend_id: string; // Who received request
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}
```

#### Features
1. **Send Friend Request**: Browse members, send request
2. **Accept/Decline**: Manage incoming requests
3. **Friends List**: View all friends
4. **Block User**: Prevent interaction
5. **Session Attendees**: Send friend requests from session attendees

#### API Endpoints
```
GET /api/friendships - List friends (status filter)
POST /api/friendships - Send friend request
PUT /api/friendships/:id/accept - Accept request
PUT /api/friendships/:id/decline - Decline request
DELETE /api/friendships/:id - Remove friend
```

---

### 9. Profile Management

#### User Profile
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'member' | 'community_manager' | 'super_admin';
  profile_image: string | null; // Base64
  location: string | null;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | null;
  gender: 'male' | 'female' | 'prefer_not_to_say' | null;
  otp_verified: boolean;
  created_at: string;
}
```

#### Profile Features
1. **Edit Profile**: Update name, email, phone, location, skill level, gender
2. **Profile Picture**: Upload from camera/gallery, auto-resize to 500x500
3. **Change Password**: Verify current password, set new
4. **Security Settings**: Enable/disable PIN, biometric
5. **View Bookings**: Past and upcoming sessions
6. **Order History**: All payments and refunds
7. **Logout**: Clear local data + token

---

### 10. Push Notifications

#### Notification Types
1. **Session Reminders**: 1 hour before session
2. **Booking Confirmations**: When session booked
3. **Session Updates**: When session edited/cancelled
4. **Announcements**: From community managers
5. **Friend Requests**: When someone sends request
6. **Session Notifications**: Manager sends custom message to attendees

#### Implementation
```typescript
// Backend: expo-server-sdk
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
const expo = new Expo();

// Send notification
const messages: ExpoPushMessage[] = [{
  to: pushToken,
  sound: 'default',
  title: 'Session Reminder',
  body: 'Your session starts in 1 hour',
  data: { sessionId: '123' }
}];

await expo.sendPushNotificationsAsync(messages);

// Frontend: Register for notifications
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync({
  projectId: 'your-expo-project-id'
});

// Save token to backend
await api.savePushToken(token.data);
```

---

### 11. Apple Design System

#### Design Principles
- **SF Pro Rounded**: System font with rounded style
- **Color Palette**: System colors (blue, red, green, gray scales)
- **Spacing**: 8px grid system (8, 16, 24, 32, 40)
- **Border Radius**: 8, 12, 16, 20px
- **Shadows**: Elevation with subtle shadows
- **Animations**: Smooth transitions (200-300ms)

#### Component Library
```typescript
// Colors
Colors.systemBlue, Colors.systemRed, Colors.systemGreen
Colors.systemGray, Colors.systemGray2, Colors.systemGray3
Colors.white, Colors.black, Colors.background

// Typography
TextStyles.title1, TextStyles.title2, TextStyles.title3
TextStyles.headline, TextStyles.body, TextStyles.caption

// Spacing
Spacing.xs (8), Spacing.sm (12), Spacing.md (16)
Spacing.lg (24), Spacing.xl (32), Spacing.xxl (40)

// Components
Button, Card, Input, TabBar, NavigationBar
```

---

### 12. Security Features

#### Authentication Security
1. **JWT Tokens**: HTTP-only, 7-day expiry
2. **Password Hashing**: bcrypt with salt rounds
3. **OTP Expiry**: 10 minutes
4. **PIN Storage**: Expo SecureStore (encrypted)
5. **Biometric Auth**: Face ID / Touch ID

#### Token Validation
- Validate token on app startup
- Check if user still exists (handle deleted users)
- Only treat 401/403/404 as auth errors (not network errors)
- Clear all local data if user deleted

#### API Security
- CORS enabled for frontend origin
- Request validation with express-validator
- Rate limiting (future)
- SQL injection prevention (parameterized queries)

---

### 13. Database Schema

#### Core Tables
```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR UNIQUE NOT NULL,
  phone VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'member',
  profile_image TEXT,
  location VARCHAR,
  skill_level VARCHAR,
  gender VARCHAR,
  otp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Communities
CREATE TABLE communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR,
  owner_id UUID REFERENCES users(id),
  logo TEXT,
  membership_fee INTEGER DEFAULT 0,
  stripe_price_id VARCHAR,
  instagram_url VARCHAR,
  facebook_url VARCHAR,
  x_url VARCHAR,
  website_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sub-Communities
CREATE TABLE sub_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  description TEXT,
  image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sub_community_id UUID REFERENCES sub_communities(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,
  max_participants INTEGER DEFAULT 10,
  current_participants INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  stripe_price_id VARCHAR,
  skill_level VARCHAR,
  gender_restriction VARCHAR,
  status VARCHAR DEFAULT 'upcoming',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'confirmed',
  payment_status VARCHAR DEFAULT 'completed',
  amount_paid INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Community Memberships
CREATE TABLE community_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, community_id)
);

-- User Roles
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_name VARCHAR NOT NULL,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sub_community_id UUID REFERENCES sub_communities(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Announcements
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sub_community_id UUID REFERENCES sub_communities(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Friendships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Orders (Payments)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  community_id UUID REFERENCES communities(id) ON DELETE SET NULL,
  type VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'aed',
  status VARCHAR DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pending Registrations (OTP flow)
CREATE TABLE pending_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL,
  phone VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTP Codes
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Push Tokens
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR NOT NULL UNIQUE,
  device_type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session Templates
CREATE TABLE session_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  sub_community_id UUID REFERENCES sub_communities(id) ON DELETE SET NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  location VARCHAR,
  start_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 10,
  price INTEGER DEFAULT 0,
  skill_level VARCHAR,
  gender_restriction VARCHAR,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 14. Environment Variables

#### Backend (.env)
```bash
# Server
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Twilio (WhatsApp OTP)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_VERIFY_SERVICE_SID=VAxxx
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
TWILIO_CONTENT_SID=HXxxx  # Approved WhatsApp template

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (app.config.js)
```javascript
export default {
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  }
}
```

---

### 15. Deployment

#### Backend (Railway)
1. Connect GitHub repository
2. Set environment variables in Railway dashboard
3. Auto-deploy on git push to main branch
4. Configure custom domain (optional)

#### Frontend (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas init
eas build:configure

# Build iOS
eas build --platform ios --profile production

# Submit to TestFlight
# Download IPA and upload via Transporter app

# Publish OTA Update (without new build)
eas update --branch production --message "Bug fixes"
```

#### Database (Supabase)
1. Create project on supabase.com
2. Run SQL migrations to create tables
3. Configure Row Level Security (RLS) policies
4. Enable real-time (optional for chat)

---

### 16. Third-Party Integrations

#### Twilio WhatsApp Business API
1. Create Twilio account
2. Purchase phone number
3. Apply for WhatsApp Business API access
4. Create Meta Business Manager account
5. Create approved WhatsApp message templates
6. Use Content API with template SID

```typescript
// Send WhatsApp OTP
await twilioClient.messages.create({
  from: process.env.TWILIO_WHATSAPP_FROM,
  to: `whatsapp:${phone}`,
  contentSid: process.env.TWILIO_CONTENT_SID,
  contentVariables: JSON.stringify({ 1: otpCode })
});
```

#### Stripe Setup
1. Create Stripe account
2. Get API keys (test and live)
3. Enable Apple Pay
4. Create products and prices
5. Set up webhooks (optional)

#### Apple Developer Account
1. Enroll in Apple Developer Program ($99/year)
2. Create App ID and Bundle Identifier
3. Create Distribution Certificate and Provisioning Profile
4. Configure App Store Connect
5. Submit app for review

---

### 17. App Navigation Structure

```
RootNavigator (Stack)
├─ SplashScreen
├─ AuthScreen (Login/Register/OTP/PasswordReset)
├─ PinSetupScreen
└─ MainTabs (Bottom Tabs)
    ├─ SessionsTab (Stack)
    │   ├─ SessionsScreen (List of sessions)
    │   ├─ SessionDetailsScreen
    │   └─ BookingConfirmationScreen
    ├─ CommunitiesTab (Stack)
    │   ├─ CommunitiesScreen (List of communities)
    │   ├─ CommunityDetailsScreen
    │   ├─ JoinCommunityScreen (Payment)
    │   └─ ChatScreen
    ├─ ProfileTab (Stack)
    │   ├─ ProfileScreen
    │   ├─ EditProfileScreen
    │   ├─ BookingsScreen
    │   ├─ OrderHistoryScreen
    │   └─ SettingsScreen
    ├─ ManagerTab (Stack) - Only if user is manager
    │   ├─ CommunityManagerDashboard
    │   ├─ CreateSessionScreen
    │   ├─ EditSessionScreen
    │   ├─ ManageSessionsScreen
    │   ├─ SessionTemplatesScreen
    │   ├─ BulkSessionPublishScreen
    │   ├─ SubCommunitiesManagerScreen
    │   ├─ SendAnnouncementScreen
    │   ├─ SendSessionNotificationScreen
    │   └─ ManageManagersScreen
    └─ FriendsTab (Stack)
        ├─ FriendsScreen (List of friends)
        ├─ FriendRequestsScreen
        └─ UserProfileScreen
```

---

### 18. Key User Stories

#### As a Member:
1. I can register with my phone number and verify via WhatsApp OTP
2. I can browse communities and see their details
3. I can join a community by paying the membership fee
4. I can view all sessions in my communities
5. I can book a session by paying the session fee
6. I can cancel my booking and get a refund (if >24h before)
7. I can chat with other members in community chat
8. I can view announcements from managers
9. I can send friend requests to other members
10. I can update my profile and upload a profile picture
11. I can enable PIN and biometric authentication
12. I can view my booking history and order history

#### As a Community Manager:
1. I can create a new community with membership fee
2. I can edit my community details and upload a logo
3. I can create sub-communities (groups)
4. I can create session templates for recurring sessions
5. I can create sessions manually or from templates
6. I can bulk publish sessions (e.g., every Monday for 8 weeks)
7. I can edit or cancel sessions (with automatic refunds)
8. I can view all session attendees
9. I can send announcements to all community members
10. I can send push notifications to session attendees
11. I can assign other users as managers
12. I can view community analytics (members, sessions, revenue)

#### As a Super Admin:
1. I can view all communities and sessions
2. I can assign manager roles to any user
3. I can manage any community
4. I can view all users and their roles

---

### 19. Error Handling & Edge Cases

#### Authentication Errors
- Invalid credentials: Show error message
- Expired OTP: Allow resend
- Deleted user with stored token: Clear all local data, show "Account not found"
- Network errors during token validation: Log warning, continue (don't log out)
- Only treat 401/403/404 as "user deleted", not 500/network errors

#### Payment Errors
- Card declined: Show Stripe error message
- Payment timeout: Retry or cancel
- Refund failure: Log error, notify admin
- Duplicate booking: Prevent with unique constraint

#### Session Errors
- Session full: Disable booking button
- Session cancelled: Notify all attendees, automatic refund
- Past sessions: Show as "Completed", hide booking button
- Manager edits session: Notify all attendees

#### Chat Errors
- Failed to send message: Retry mechanism
- Failed to load messages: Show error toast
- Empty chat: Show placeholder text

#### Profile Errors
- Image too large: Resize to 500x500
- Invalid email format: Validate on frontend
- Phone already registered: Show error message

---

### 20. Testing Checklist

#### Authentication
- [ ] Register new user
- [ ] Verify WhatsApp OTP
- [ ] Set up PIN
- [ ] Enable biometric
- [ ] Login with PIN
- [ ] Login with biometric
- [ ] Login with email/password
- [ ] Reset password
- [ ] Handle deleted user (clear all data)

#### Communities
- [ ] Browse communities
- [ ] Join community (payment)
- [ ] View community details
- [ ] Leave community
- [ ] Create community (manager)
- [ ] Edit community (manager)
- [ ] Create sub-community (manager)

#### Sessions
- [ ] Browse sessions
- [ ] Book session (payment)
- [ ] View session details
- [ ] Cancel booking (refund)
- [ ] View attendees
- [ ] Create session (manager)
- [ ] Edit session (manager)
- [ ] Cancel session (manager + refunds)
- [ ] Bulk publish from template

#### Payments
- [ ] Pay with card
- [ ] Pay with Apple Pay
- [ ] Receive refund
- [ ] View order history
- [ ] Handle payment errors

#### Chat
- [ ] Send message
- [ ] Receive messages (real-time)
- [ ] Sub-community chat
- [ ] Community chat
- [ ] Auto-scroll to new messages

#### Notifications
- [ ] Receive push notification
- [ ] Session reminder (1h before)
- [ ] Announcement notification
- [ ] Friend request notification
- [ ] Session update notification

#### Profile
- [ ] Edit profile
- [ ] Upload profile picture
- [ ] Change password
- [ ] View bookings
- [ ] View order history
- [ ] Logout

---

### 21. Performance Optimizations

#### Frontend
- Use React.memo for expensive components
- Lazy load screens with React.lazy
- Optimize images: resize before upload (500x500)
- Debounce search inputs
- Cache API responses with AsyncStorage
- Minimize re-renders with useCallback/useMemo
- Use FlatList for long lists (virtual scrolling)

#### Backend
- Database indexing on frequently queried columns
- Pagination for large result sets (limit + offset)
- Use database joins instead of multiple queries
- Cache user roles in JWT token
- Connection pooling for Supabase client
- Compress API responses (gzip)

#### Database
- Add indexes: user_id, community_id, session_id, created_at
- Use CASCADE DELETE for related records
- Archive old sessions (status: 'completed')
- Clean up expired OTP codes (cron job)

---

### 22. Future Enhancements

#### Phase 2 Features
1. **Live Session Updates**: Socket.io for real-time session availability
2. **Ratings & Reviews**: Rate sessions and venues
3. **Leaderboards**: Rank players by skill/participation
4. **Tournaments**: Create and manage tournaments
5. **Team Formation**: Auto-match players for doubles
6. **Video Content**: Upload session highlights
7. **Advanced Analytics**: Revenue reports, attendance trends
8. **Multi-language Support**: i18n for Arabic, Spanish, etc.
9. **Dark Mode**: Full dark theme support
10. **Referral System**: Invite friends, earn credits

#### Phase 3 Features
1. **AI Matchmaking**: ML-based player matching
2. **Equipment Marketplace**: Buy/sell paddles, shoes, etc.
3. **Coaching Module**: Book private lessons
4. **Venue Booking**: Integrate with court booking systems
5. **Live Scoring**: Real-time match scoring
6. **Social Feed**: Instagram-like activity feed
7. **Challenges**: Create and join player challenges
8. **Subscription Plans**: Monthly/annual memberships
9. **Multi-sport Support**: Tennis, pickleball, squash, etc.
10. **White-label Solution**: Rebrand for other sports

---

## Getting Started (Step-by-Step)

### 1. Initialize Project
```bash
# Backend
mkdir sports-community-app && cd sports-community-app
mkdir backend && cd backend
npm init -y
npm install express typescript ts-node @types/node @types/express
npm install @supabase/supabase-js bcrypt jsonwebtoken express-validator
npm install cors dotenv twilio stripe nodemailer expo-server-sdk
npx tsc --init

# Frontend
cd ..
npx create-expo-app frontend --template blank-typescript
cd frontend
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-navigation/native-stack axios
npm install @stripe/stripe-react-native expo-notifications
npm install expo-local-authentication expo-secure-store
npm install expo-image-picker @react-native-async-storage/async-storage
```

### 2. Set Up Database (Supabase)
- Create Supabase project
- Copy SQL schema from Section 13
- Run migrations in Supabase SQL Editor
- Get API keys (anon key + service key)

### 3. Set Up Backend
- Create Express server with TypeScript
- Set up routes: auth, communities, sessions, bookings, chat, etc.
- Implement JWT authentication middleware
- Configure Stripe, Twilio, Nodemailer

### 4. Set Up Frontend
- Create navigation structure (Stack + Tabs)
- Implement AuthContext for global state
- Build screens: Auth, Communities, Sessions, Profile, Manager Dashboard
- Integrate Stripe payment sheets
- Set up push notifications

### 5. Deploy
- Backend: Deploy to Railway (connect GitHub repo)
- Frontend: Build with EAS Build for iOS/Android
- Database: Already hosted on Supabase

### 6. Testing
- Test all user flows end-to-end
- Test payments with Stripe test cards
- Test WhatsApp OTP with real phone numbers
- TestFlight beta testing with users

---

## Additional Resources

### Documentation
- Expo: https://docs.expo.dev
- React Navigation: https://reactnavigation.org
- Stripe React Native: https://stripe.com/docs/payments/accept-a-payment?platform=react-native
- Supabase: https://supabase.com/docs
- Twilio WhatsApp API: https://www.twilio.com/docs/whatsapp

### Design References
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines
- Expo Design System: https://github.com/expo/expo/tree/main/packages/expo-dev-client

### Tools
- EAS Build: https://docs.expo.dev/build/introduction
- Railway: https://railway.app/docs
- Transporter (iOS upload): Mac App Store
- Postman (API testing): https://www.postman.com

---

## Summary

This specification covers a complete production-ready sports community management app with:
- ✅ 32+ screens
- ✅ 15+ database tables
- ✅ WhatsApp OTP authentication
- ✅ Stripe payments & refunds
- ✅ Community & session management
- ✅ Real-time chat
- ✅ Push notifications
- ✅ Role-based access control
- ✅ PIN & biometric security
- ✅ Profile & friend system
- ✅ Manager dashboard & analytics
- ✅ Session templates & bulk publishing
- ✅ Apple Design System UI
- ✅ Production deployment (Railway + EAS)

Use this specification to build a competitor app or adapt it for other sports/communities. All technical details, API endpoints, database schemas, and implementation patterns are included.
