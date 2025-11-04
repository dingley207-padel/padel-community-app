# Padel Community App - Setup Guide

This guide will walk you through setting up the Padel Community App from scratch.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Supabase Setup](#supabase-setup)
3. [Stripe Setup](#stripe-setup)
4. [Twilio Setup](#twilio-setup)
5. [Email Service Setup](#email-service-setup)
6. [Backend Configuration](#backend-configuration)
7. [Frontend Configuration](#frontend-configuration)
8. [Running the App](#running-the-app)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **iOS Simulator** (Mac only) or **Android Studio** (for mobile testing)
- **Expo Go** app on your phone (optional, for physical device testing)

### Required Accounts
- [Supabase](https://supabase.com) - Free tier available
- [Stripe](https://stripe.com) - Test mode is free
- [Twilio](https://twilio.com) - Free trial available
- Gmail or other email service for OTP

## Supabase Setup

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Name**: Padel Community App
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select closest to your users
4. Click **"Create new project"** and wait 2-3 minutes

### 2. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy these values (you'll need them later):
   - **Project URL** (e.g., https://xxxxx.supabase.co)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

### 3. Set Up the Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **"New Query"**
3. Copy the entire contents of `backend/database/schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** or press `Cmd/Ctrl + Enter`
6. You should see "Success. No rows returned"

### 4. Verify Tables Were Created

1. Go to **Table Editor**
2. You should see these tables:
   - users
   - communities
   - sessions
   - bookings
   - payments
   - otp
   - community_members

## Stripe Setup

### 1. Create a Stripe Account

1. Go to [Stripe](https://stripe.com) and sign up
2. You'll start in **Test Mode** (perfect for development)

### 2. Get Your API Keys

1. Go to **Developers** → **API keys**
2. Copy these values:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

### 3. Enable Stripe Connect (for Manager Payouts)

1. Go to **Connect** in the sidebar
2. Click **"Get Started"**
3. Choose **"Platform or marketplace"**
4. Complete the onboarding

### 4. Get Webhook Secret (Optional for now)

1. Go to **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. Enter: `https://your-backend-url/api/webhooks/stripe`
4. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`)

## Twilio Setup

### 1. Create a Twilio Account

1. Go to [Twilio](https://twilio.com) and sign up
2. Complete phone verification
3. You'll get free trial credits ($15-20)

### 2. Set Up Twilio Verify

1. In Twilio Console, go to **Explore Products**
2. Click on **Verify**
3. Click **"Create Service Now"**
4. Name it: `Padel OTP`
5. Copy the **Service SID** (starts with `VA...`)

### 3. Get Your Account Credentials

1. Go to **Dashboard**
2. Find **Account Info** section
3. Copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal)

### 4. Enable WhatsApp (Optional but Recommended)

1. In Verify service settings
2. Enable **WhatsApp** channel
3. Follow prompts to connect WhatsApp Business
4. For testing, use Twilio's test number: `whatsapp:+14155238886`

## Email Service Setup

### Option A: Gmail SMTP (Easiest for Testing)

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password

Your settings:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
```

### Option B: SendGrid (Better for Production)

1. Sign up at [SendGrid](https://sendgrid.com)
2. Go to **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Choose **"Full Access"**
5. Copy the API key (starts with `SG.`)

Your settings:
```
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.xxxxx
```

## Backend Configuration

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
```bash
cp .env.example .env
```

### 4. Fill in .env File

Open `backend/.env` and fill in all the values you copied:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_URL=http://localhost:3000

# Supabase Configuration
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# JWT Configuration
JWT_SECRET=your-random-secret-key-min-32-characters
JWT_EXPIRES_IN=7d

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PLATFORM_FEE_PERCENT=7.5

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_VERIFY_SERVICE_SID=VAxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Email Configuration (Choose one)
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@padelapp.com

# Frontend URL
FRONTEND_URL=http://localhost:19006

# Booking Configuration
BOOKING_CANCELLATION_HOURS=24
```

### 5. Generate JWT Secret

Run this command to generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`

## Frontend Configuration

### 1. Navigate to Frontend Directory
```bash
cd ../frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
```bash
cp .env.example .env
```

### 4. Fill in .env File

Open `frontend/.env`:

```env
API_URL=http://localhost:3000/api
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

**Note**: If testing on a physical device, replace `localhost` with your computer's IP address:
```env
API_URL=http://192.168.1.x:3000/api
```

To find your IP:
- **Mac**: System Preferences → Network
- **Windows**: Run `ipconfig` in Command Prompt
- **Linux**: Run `ip addr` or `hostname -I`

## Running the App

### 1. Start the Backend

In the `backend` directory:
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║   Padel Community API Server          ║
║   Environment: development             ║
║   Port: 3000                           ║
║   URL: http://localhost:3000           ║
╚════════════════════════════════════════╝
```

Test the API:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-28T...",
  "service": "Padel Community API"
}
```

### 2. Start the Frontend

Open a new terminal, go to `frontend` directory:
```bash
npm start
```

This will open Expo Dev Tools in your browser.

### 3. Run on Device/Simulator

Choose one:

**iOS Simulator** (Mac only):
- Press `i` in the terminal

**Android Emulator**:
- Start Android Studio emulator first
- Press `a` in the terminal

**Physical Device**:
- Install **Expo Go** from App Store/Play Store
- Scan the QR code shown in terminal or browser

## Testing the Application

### 1. Test Authentication

1. Open the app
2. You should see the login screen
3. Choose **Email**
4. Enter your email address
5. Click **"Send OTP"**
6. Check your email for the 6-digit code
7. Enter the code
8. If it's your first time, enter your name
9. You should be logged in!

### 2. View Sessions

After logging in, you'll see the Sessions screen (empty at first)

### 3. Create Test Data (Optional)

To test the full flow, you'll need to create communities and sessions. You can:

**Option A**: Use the API directly with Postman/curl
**Option B**: Add test data via SQL:

In Supabase SQL Editor:
```sql
-- Create a test manager user
INSERT INTO users (name, email, role, otp_verified)
VALUES ('Test Manager', 'manager@test.com', 'manager', true);

-- Get the user ID (copy this)
SELECT id, name FROM users WHERE email = 'manager@test.com';

-- Create a community (replace <user-id> with actual ID)
INSERT INTO communities (name, description, manager_id, location)
VALUES (
  'Downtown Padel Club',
  'Weekly padel sessions',
  '<user-id>',
  '123 Main St'
);

-- Get the community ID
SELECT id, name FROM communities;

-- Create a session (replace <community-id>)
INSERT INTO sessions (
  community_id,
  title,
  description,
  datetime,
  location,
  price,
  max_players,
  status,
  visibility
)
VALUES (
  '<community-id>',
  'Evening Padel Session',
  'Friendly doubles match',
  NOW() + INTERVAL '2 days',
  'Central Court',
  25.00,
  4,
  'active',
  true
);
```

Now refresh the app, and you should see the test session!

## Troubleshooting

### Backend Issues

**Error: "Missing Supabase configuration"**
- Check that `.env` file exists in `backend/` directory
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set correctly

**Error: "Failed to connect to database"**
- Verify Supabase project is running (not paused)
- Check database password is correct
- Ensure database schema was created successfully

**Error: "Failed to send OTP"**
- **Email**: Verify SMTP credentials, check spam folder
- **WhatsApp**: Verify Twilio credentials and Verify service is active

### Frontend Issues

**Error: "Network request failed"**
- Ensure backend is running (`npm run dev`)
- Check `API_URL` in `frontend/.env`
- If on physical device, use computer's IP address instead of `localhost`

**App won't load**
- Clear Expo cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

**Can't scan QR code**
- Ensure phone and computer are on same WiFi network
- Try manual connection in Expo Go app

### Common Issues

**OTP not received**
- Check spam/junk folder
- Verify email/phone format is correct
- Check Twilio trial credits haven't run out
- Review backend logs for error messages

**Payment failing**
- Ensure using test card: `4242 4242 4242 4242`
- Any future expiry date and any 3-digit CVC works
- Check Stripe is in test mode

**Database errors**
- Ensure all migrations have run
- Check Supabase logs in dashboard
- Verify table structure matches schema

## Next Steps

Once everything is running:

1. **Create your first community** (requires manager role)
2. **Create test sessions**
3. **Test the booking flow**
4. **Implement additional screens** (see PRD.md for full feature list)
5. **Set up production environment** when ready to deploy

## Getting Help

- Review the [README.md](README.md) for full documentation
- Check [PRD.md](PRD.md) for product requirements
- Review error logs in terminal
- Check Supabase logs in dashboard
- Verify all environment variables are set correctly

## Production Checklist

Before deploying to production:

- [ ] Change all secrets and API keys
- [ ] Set `NODE_ENV=production`
- [ ] Use production Stripe keys
- [ ] Set up proper domain for backend
- [ ] Configure CORS properly
- [ ] Set up SSL certificates
- [ ] Enable Stripe webhooks
- [ ] Configure production email service
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up database backups
- [ ] Test payment flows thoroughly
- [ ] Review security best practices

---

Congratulations! You should now have a fully functional Padel Community App running locally. 🎾
