# Troubleshooting Guide

Common issues and solutions for the Padel Community App.

## Frontend Issues

### Error: "expected dynamic type 'boolean', but had type 'string'"

**Problem:** NativeWind v4 configuration issue or app.json boolean type mismatch.

**Solution:**
1. Ensure you have the correct NativeWind setup files:
   - `babel.config.js` with nativewind/babel plugin
   - `metro.config.js` with withNativeWind
   - `global.css` with tailwind directives
   - `nativewind-env.d.ts` for TypeScript

2. Clear cache and restart:
   ```bash
   cd frontend
   npx expo start -c
   ```

3. Verify all files are in place:
   ```bash
   ls -la | grep -E "babel.config|metro.config|global.css|nativewind"
   ```

### App Won't Load / Metro Bundler Error

**Solution:**
```bash
# Stop all metro processes
killall node

# Clear all caches
cd frontend
rm -rf node_modules
npm install
npx expo start -c
```

### "Module not found" Errors

**Solution:**
```bash
cd frontend
npm install
```

If specific packages are missing:
```bash
npx expo install <package-name>
```

### Can't Connect to Backend from Physical Device

**Problem:** Using `localhost` which doesn't work on physical devices.

**Solution:**
1. Find your computer's IP address:
   - Mac: System Settings → Network
   - Windows: `ipconfig` in Command Prompt
   - Linux: `ip addr` or `hostname -I`

2. Update `frontend/.env`:
   ```env
   API_URL=http://192.168.1.X:3000/api  # Use your actual IP
   ```

3. Make sure your phone and computer are on the same WiFi

### iOS Simulator Not Opening

**Solution:**
```bash
sudo xcode-select --switch /Applications/Xcode.app
```

Or open Xcode → Preferences → Locations and select Command Line Tools.

## Backend Issues

### "Missing Supabase configuration"

**Problem:** Environment variables not set.

**Solution:**
1. Ensure `backend/.env` exists:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Fill in all required values in `.env`

3. Restart the backend server

### "Failed to send OTP"

**Email OTP:**
1. Check SMTP credentials in `backend/.env`
2. Verify 2FA and App Password for Gmail
3. Check spam folder
4. Review backend logs for error details

**WhatsApp OTP:**
1. Verify Twilio credentials
2. Check Twilio account has credits
3. Ensure phone number is in E.164 format (+1234567890)

### "Connection refused" or "ECONNREFUSED"

**Solution:**
1. Ensure backend is running:
   ```bash
   cd backend
   npm run dev
   ```

2. Check the port (default 3000) is not in use:
   ```bash
   lsof -i :3000
   ```

3. Kill conflicting processes if needed:
   ```bash
   kill -9 <PID>
   ```

### Database Connection Errors

**Solution:**
1. Check Supabase project status (not paused)
2. Verify connection string in `.env`
3. Test connection in Supabase dashboard
4. Ensure database schema is deployed

### "TypeError: Cannot read property..."

**Problem:** Database schema not created or tables missing.

**Solution:**
1. Go to Supabase SQL Editor
2. Run the entire `backend/database/schema.sql` file
3. Check Table Editor to verify all tables exist

## Payment / Stripe Issues

### "Payment failed"

**Test Mode:**
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC

**Live Mode:**
- Ensure Stripe account is fully verified
- Check webhook endpoints are configured
- Verify secret keys match environment

### "Stripe key not found"

**Solution:**
1. Verify keys in `backend/.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. Verify keys in `frontend/.env`:
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

3. Ensure you're using matching test/live keys

## Authentication Issues

### OTP Expired

**Solution:**
- OTPs expire after 10 minutes (configurable)
- Request a new OTP
- Check `OTP_EXPIRY_MINUTES` in `backend/.env`

### Too Many OTP Attempts

**Solution:**
- Maximum 3 attempts per OTP (configurable)
- Request a new OTP
- Check `OTP_MAX_ATTEMPTS` in `backend/.env`

### Token Expired

**Solution:**
- Tokens expire after 7 days (configurable)
- Log in again to get new token
- Check `JWT_EXPIRES_IN` in `backend/.env`

## Performance Issues

### Slow API Responses

**Solutions:**
1. Check database indexes are created (they should be in schema.sql)
2. Optimize queries if needed
3. Add database connection pooling
4. Enable caching for frequently accessed data

### Slow App Load Time

**Solutions:**
1. Optimize images (compress, use appropriate sizes)
2. Implement lazy loading for screens
3. Use React.memo for expensive components
4. Profile with React DevTools

## Development Issues

### TypeScript Errors

**Solution:**
```bash
# Backend
cd backend
npx tsc --noEmit

# Frontend
cd frontend
npx tsc --noEmit
```

Fix any type errors shown.

### Linting Errors

**Solution:**
```bash
# Install ESLint
npm install -D eslint

# Run linter
npx eslint src/
```

### Hot Reload Not Working

**Solution:**
```bash
# Backend
# Use nodemon (already configured)
cd backend
npm run dev

# Frontend
# Restart Expo with cache clear
cd frontend
npx expo start -c
```

## Database Issues

### Schema Changes Not Applying

**Solution:**
1. Manual migration needed - no auto-migration set up
2. Run new SQL in Supabase SQL Editor
3. Or drop and recreate tables (development only!)

### Booking Fails with "Session is fully booked"

**Problem:** Race condition or booked_count out of sync.

**Solution:**
The atomic triggers should prevent this, but if it happens:
```sql
-- Fix booked_count
UPDATE sessions s
SET booked_count = (
  SELECT COUNT(*) FROM bookings
  WHERE session_id = s.id
  AND cancelled_at IS NULL
);
```

## Deployment Issues

### Backend Won't Start in Production

**Checklist:**
- [ ] Environment variables set correctly
- [ ] Database accessible from production server
- [ ] Node version matches (18+)
- [ ] All dependencies installed
- [ ] TypeScript compiled: `npm run build`
- [ ] Firewall allows connections on app port

### Frontend Build Fails

**Solution:**
```bash
# Clear everything
cd frontend
rm -rf node_modules
rm -rf .expo
npm install
eas build --clear-cache
```

## Common Commands

### Reset Everything (Nuclear Option)

**Backend:**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

**Frontend:**
```bash
cd frontend
rm -rf node_modules package-lock.json .expo
npm install
npx expo start -c
```

**Database:**
```sql
-- In Supabase SQL Editor
-- Drop all tables (careful!)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS community_members CASCADE;
DROP TABLE IF EXISTS communities CASCADE;
DROP TABLE IF EXISTS otp CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run schema.sql
```

### Check Logs

**Backend:**
- Logs appear in terminal where `npm run dev` is running
- Add more logging: `console.log()` or use proper logger

**Frontend:**
- React Native Debugger
- Expo Developer Tools (press `m` in terminal)
- Chrome DevTools (press `j` in terminal)

**Database:**
- Supabase Dashboard → Logs
- Query performance in SQL Editor

## Getting Help

If you're still stuck:

1. Check the error message carefully
2. Search error message on Google/Stack Overflow
3. Review relevant documentation:
   - [README.md](README.md)
   - [SETUP_GUIDE.md](SETUP_GUIDE.md)
   - [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
4. Check GitHub Issues for similar problems
5. Enable verbose logging and review output

## Debugging Tips

### Backend Debugging

Add this to see all requests:
```typescript
// In backend/src/index.ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Frontend Debugging

```typescript
// In any component
console.log('Debug:', variable);

// Or use React Native Debugger
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // Use carefully
```

### Database Debugging

```sql
-- See recent OTPs
SELECT * FROM otp ORDER BY created_at DESC LIMIT 10;

-- See recent bookings
SELECT * FROM bookings ORDER BY timestamp DESC LIMIT 10;

-- Check session availability
SELECT * FROM available_sessions;

-- See user activity
SELECT u.name, COUNT(b.id) as booking_count
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
GROUP BY u.id, u.name;
```

---

**Still having issues?** Create an issue on GitHub with:
- Error message (full stack trace)
- Steps to reproduce
- Environment (OS, Node version, etc.)
- Relevant logs
