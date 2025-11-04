# Padel Community App - Quick Start

**Welcome!** This guide will get you up and running in 10 minutes.

## Prerequisites

✅ Node.js 18+ installed
✅ npm installed
✅ Code editor (VS Code recommended)

## Step 1: Install Dependencies (2 minutes)

```bash
# Navigate to project
cd Padel

# Install everything (backend + frontend)
npm run install-all
```

## Step 2: Set Up External Services (5 minutes)

### A. Supabase (Database)
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign up
3. Create new project (wait 2-3 min)
4. Go to Settings → API → Copy these:
   - Project URL
   - anon/public key
   - service_role key
5. Go to SQL Editor → New Query
6. Copy contents of `backend/database/schema.sql` and run it

### B. Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) → Sign up
2. Stay in **Test Mode**
3. Go to Developers → API keys
4. Copy:
   - Publishable key (pk_test_...)
   - Secret key (sk_test_...)

### C. Email (Gmail is easiest)

1. Enable 2FA on your Google account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification
   - App passwords → Mail
   - Copy the 16-character password

### D. Twilio (WhatsApp - Optional)

1. Go to [twilio.com](https://twilio.com) → Sign up
2. Get $15 free credits
3. Go to Verify → Create Service
4. Copy Account SID, Auth Token, Service SID

## Step 3: Configure Environment (2 minutes)

### Backend Configuration

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
# Supabase (from Step 2A)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your_generated_secret_here

# Stripe (from Step 2B)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email (from Step 2C)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password

# Twilio (from Step 2D - optional)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
```

### Frontend Configuration

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
API_URL=http://localhost:3000/api
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Same as backend
```

## Step 4: Run the App (1 minute)

### Option A: Run Both Together
```bash
# From project root
npm run dev
```

### Option B: Run Separately

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

## Step 5: Test It

1. Backend should show:
   ```
   ╔════════════════════════════════════════╗
   ║   Padel Community API Server          ║
   ║   Port: 3000                           ║
   ╚════════════════════════════════════════╝
   ```

2. Test backend health:
   ```bash
   curl http://localhost:3000/health
   ```

3. Frontend: Choose how to run:
   - **iOS Simulator** (Mac): Press `i`
   - **Android Emulator**: Press `a`
   - **Phone**: Scan QR code with Expo Go app

4. You should see the login screen!

## Quick Test Flow

1. Enter your email
2. Click "Send OTP"
3. Check your email for 6-digit code
4. Enter code
5. Enter your name (first time only)
6. You're in! 🎉

## Common Issues

**"Connection refused"**
- Make sure backend is running
- Check backend/.env has correct values

**"OTP not received"**
- Check spam folder
- Verify SMTP credentials in backend/.env
- Check backend logs for errors

**"Can't connect to API from phone"**
- Replace `localhost` in frontend/.env with your computer's IP:
  ```env
  API_URL=http://192.168.1.X:3000/api
  ```

**"Module not found"**
- Run `npm install` in both backend and frontend

## Next Steps

✅ You have a working app!

**To test more features:**

1. **Create test community** (requires SQL for now):
   ```sql
   -- In Supabase SQL Editor
   INSERT INTO communities (name, description, manager_id, location)
   VALUES ('Test Club', 'My club', '<your-user-id>', 'Test Location');
   ```

2. **Create test session**:
   ```sql
   INSERT INTO sessions (community_id, title, datetime, location, price, max_players)
   VALUES ('<community-id>', 'Test Session', NOW() + INTERVAL '1 day', 'Court 1', 25, 4);
   ```

3. **View sessions** in the app - refresh to see them!

## File Reference

- `README.md` - Full documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `API_DOCUMENTATION.md` - API reference
- `PROJECT_STATUS.md` - What's built and what's next
- `PRD.md` - Product requirements

## Quick Commands

```bash
# Backend
cd backend
npm run dev      # Start dev server
npm run build    # Compile TypeScript
npm start        # Run production

# Frontend
cd frontend
npm start        # Start Expo
npm run ios      # iOS simulator
npm run android  # Android emulator
```

## API Quick Test

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"you@email.com","medium":"email"}'

# Get sessions
curl http://localhost:3000/api/sessions/available
```

## Test Card (Stripe)

When testing payments (once payment UI is built):
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

---

**That's it! You're ready to build. 🎾**

Need help? Check:
1. SETUP_GUIDE.md for detailed instructions
2. Backend terminal for error messages
3. Supabase dashboard for database logs
4. Frontend terminal for React Native errors

**Happy coding!**
