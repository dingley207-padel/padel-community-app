# Padel Community App

A mobile-first platform for organizing and booking padel sessions. Connect community managers and players through real-time session management, secure payments, and frictionless booking.

## Features

### For Players
- **OTP Authentication** - Sign in via email or WhatsApp
- **Session Discovery** - Browse available padel sessions in real-time
- **Instant Booking** - Reserve and pay for spots with Stripe integration
- **Booking Management** - View and cancel bookings
- **Community Membership** - Join multiple communities

### For Community Managers
- **Session Management** - Create, update, and cancel sessions
- **Capacity Control** - Set max players and track bookings in real-time
- **Payment Processing** - Receive payouts via Stripe Connect
- **Community Management** - Create and manage multiple communities
- **Dashboard** - Track bookings, payments, and attendance

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL via Supabase
- **Authentication**: Custom OTP-based JWT auth
- **Payments**: Stripe API with Connect
- **Notifications**:
  - Email: SMTP / SendGrid
  - WhatsApp: Twilio Verify API

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Payment UI**: Stripe React Native SDK

## Project Structure

```
Padel/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Stripe, Twilio, Email config
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, validation middleware
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helper functions
│   │   └── index.ts         # Server entry point
│   ├── database/
│   │   └── schema.sql       # PostgreSQL schema
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── screens/         # Screen components
│   │   ├── components/      # Reusable UI components
│   │   ├── navigation/      # Navigation configuration
│   │   ├── contexts/        # React context providers
│   │   ├── services/        # API client
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── App.tsx              # App entry point
│   ├── package.json
│   └── tailwind.config.js
│
└── PRD.md                   # Product Requirements Document
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (Supabase recommended)
- Stripe account
- Twilio account (for WhatsApp OTP)
- Email service (SMTP or SendGrid)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

   Required environment variables:
   ```env
   # Server
   PORT=3000
   NODE_ENV=development

   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key

   # JWT
   JWT_SECRET=your_random_secret_key
   JWT_EXPIRES_IN=7d

   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_PLATFORM_FEE_PERCENT=7.5

   # Twilio (WhatsApp OTP)
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_VERIFY_SERVICE_SID=your_verify_service_sid

   # Email (Choose SMTP or SendGrid)
   EMAIL_SERVICE=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_password
   EMAIL_FROM=noreply@padelapp.com
   ```

4. **Set up the database**

   Connect to your Supabase PostgreSQL database and run the schema:
   ```bash
   psql -h your-db-host -U postgres -d postgres -f database/schema.sql
   ```

   Or use Supabase SQL Editor to execute `database/schema.sql`

5. **Run the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update with your values:
   ```env
   API_URL=http://localhost:3000/api
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. **Start the Expo development server**
   ```bash
   npm start
   ```

5. **Run on a device or simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## API Documentation

### Authentication

#### Send OTP
```http
POST /api/auth/send-otp
Content-Type: application/json

{
  "identifier": "user@example.com",
  "medium": "email"
}
```

#### Verify OTP
```http
POST /api/auth/verify-otp
Content-Type: application/json

{
  "identifier": "user@example.com",
  "code": "123456",
  "name": "John Doe"  // Optional, for new users
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Sessions

#### Get Available Sessions
```http
GET /api/sessions/available
```

#### Create Session (Manager only)
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "community_id": "uuid",
  "title": "Evening Padel Session",
  "description": "Friendly doubles match",
  "datetime": "2025-11-01T18:00:00Z",
  "location": "Central Padel Court",
  "price": 25.00,
  "max_players": 4,
  "visibility": true
}
```

### Bookings

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "session_id": "uuid",
  "payment_method_id": "pm_..."
}
```

#### Get User Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

### Communities

#### Get All Communities
```http
GET /api/communities
```

#### Create Community
```http
POST /api/communities
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Downtown Padel Club",
  "description": "Weekly padel sessions in downtown",
  "location": "123 Main St, City"
}
```

## Database Schema

Key tables:
- **users** - User accounts with OTP verification
- **communities** - Manager-created communities
- **sessions** - Padel session schedules
- **bookings** - User session registrations
- **payments** - Stripe payment records
- **otp** - One-time password verification codes
- **community_members** - User-community relationships

See [backend/database/schema.sql](backend/database/schema.sql) for complete schema.

## Key Features Implementation

### Atomic Seat Allocation
The booking system uses PostgreSQL triggers to atomically increment/decrement `booked_count` to prevent overbooking:

```sql
CREATE TRIGGER booking_increment_count BEFORE INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION increment_booked_count();
```

### OTP Authentication
- Supports both email and WhatsApp delivery
- 6-digit codes with 10-minute expiry
- Rate limiting with max 3 attempts
- Passwordless authentication via JWT

### Payment Processing
- Stripe Payment Intents for secure checkout
- Platform fee (configurable, default 7.5%)
- Stripe Connect for manager payouts
- Automatic refunds on cancellation

### Real-time Availability
Uses database views for efficient queries:
```sql
CREATE VIEW available_sessions AS
SELECT *, (max_players - booked_count) as available_spots
FROM sessions WHERE status = 'active' AND datetime > NOW();
```

## Development Commands

### Backend
```bash
npm run dev      # Start development server with hot reload
npm run build    # Compile TypeScript to JavaScript
npm start        # Run compiled production server
```

### Frontend
```bash
npm start        # Start Expo development server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run in web browser
```

## Deployment

### Backend Deployment (Render/Railway/Fly.io)
1. Set environment variables in hosting platform
2. Build: `npm run build`
3. Start: `npm start`
4. Ensure PostgreSQL database is accessible

### Frontend Deployment (Expo EAS)
1. Install EAS CLI: `npm install -g eas-cli`
2. Configure: `eas build:configure`
3. Build for iOS: `eas build --platform ios`
4. Build for Android: `eas build --platform android`
5. Submit to stores: `eas submit`

## Environment Variables Summary

### Backend Required
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` - Database access
- `JWT_SECRET` - Token signing
- `STRIPE_SECRET_KEY` - Payment processing
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` - WhatsApp OTP
- `SMTP_USER`, `SMTP_PASS` - Email OTP

### Frontend Required
- `API_URL` - Backend API endpoint
- `STRIPE_PUBLISHABLE_KEY` - Stripe client-side key

## Testing

Test OTP flow without sending real messages:
1. Check database `otp` table for generated codes during development
2. Use Stripe test mode with test card: 4242 4242 4242 4242

## Future Enhancements

- [ ] Manager analytics dashboard
- [ ] Chat between players
- [ ] Skill-level matching
- [ ] Recurring sessions automation
- [ ] Push notifications
- [ ] Multi-language support
- [ ] Fitness tracker integrations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Documentation

- **[QUICK_START.md](QUICK_START.md)** - Get started in 10 minutes
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup instructions
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - Current status and roadmap
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - Common issues and solutions
- **[FRONTEND_FIXES.md](FRONTEND_FIXES.md)** - NativeWind v4 setup guide
- **[FINAL_FIX.md](FINAL_FIX.md)** - Boolean type error resolution

## Support

For issues and questions:
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common solutions
- Review the documentation files above
- Create an issue on GitHub
- Email: support@padelapp.com

---

**Built with ❤️ for the Padel community**
