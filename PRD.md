# Padel Community App — Product Requirements Document (PRD)

**Version:** v1.0  
**Date:** October 2025  
**Owner:** [Your Name]  
**Status:** Ready for Development

---

## 1. Overview

The Padel Community App connects community managers and players to organize and join social padel sessions.

- **Community Managers** can create and manage sessions, set availability, price, and capacity.
- **Players** can register (via OTP email or WhatsApp), browse sessions, book spots, and pay instantly.

**Goal:** Build a simple, real-time booking platform for padel communities with live availability, frictionless payments, and lightweight communication.

---

## 2. User Roles

### Player
- Registers via OTP (email or WhatsApp).
- Joins one or more communities.
- Views available sessions and books in real time.
- Pays securely through Stripe.
- Receives notifications for confirmations and reminders.

### Community Manager
- Creates and manages one or more communities.
- Defines sessions with configurable time, location, price, and availability.
- Views and manages bookings and payments.
- Cancels or modifies sessions with notifications to members.

---

## 3. Authentication & Registration

### Flow
1. User enters email or phone number.
2. System sends a 6-digit OTP via:
   - Email (SendGrid, Supabase Auth, or custom service)
   - WhatsApp (Twilio Verify API)
3. User enters OTP for verification.
4. On success, user account is created or authenticated.
5. App issues JWT for session management (passwordless).

### Data Fields
| Field | Type | Description |
|--------|------|-------------|
| id | UUID | Unique identifier |
| name | string | Display name |
| email | string (nullable) | Used if registered via email |
| phone | string (nullable) | Used if registered via WhatsApp |
| otp_verified | boolean | True after successful verification |
| role | enum(`member`, `manager`) | Defines permissions |
| created_at | timestamp | Auto-generated |

---

## 4. Core Features

### A. Session Management (Manager)
- Create session: title, description, date/time, location, price, max players, visibility.
- Recurring sessions: duplicate or repeat weekly.
- Real-time availability (booked vs max capacity).
- Edit or cancel sessions with notifications.
- Dashboard to view sessions, bookings, and payments.

### B. Session Discovery & Booking (Player)
- Session feed or calendar view.
- Join & pay flow integrated with Stripe.
- Prevent overbooking via atomic seat allocation.
- Instant confirmation + email/WhatsApp message.
- Optional cancellation within allowed window.

### C. Payments
- Stripe integration (Payments + Connect).
- Accepted: credit/debit, Apple Pay, Google Pay.
- Platform fee (5–10%) retained per booking.
- Weekly payout to community managers.

### D. Notifications
- Email + WhatsApp (push optional in later phase).
- Event-based triggers:
  - OTP delivery
  - Booking confirmation
  - Session reminder (24h before)
  - Session update/cancellation
  - Payment receipt

### E. Profiles
**Manager**
- Name, community name, profile image, location, description, bank info.

**Player**
- Name, profile image, location, skill level (optional), session history.

---

## 5. Data Model

**User**
```
id | name | email | phone | otp_verified | role | created_at
```

**Community**
```
id | name | description | manager_id | location
```

**Session**
```
id | community_id | title | description | datetime | location | price | max_players | booked_count | status
```

**Booking**
```
id | user_id | session_id | payment_status | timestamp
```

**Payment**
```
id | booking_id | amount | payment_method | status | stripe_txn_id
```

**OTP**
```
id | user_id | code | medium(email|whatsapp) | expires_at | verified
```

---

## 6. Tech Stack

| Layer | Technology | Notes |
|--------|-------------|-------|
| Frontend | React Native (Expo) | Cross-platform mobile-first |
| Styling | NativeWind / TailwindCSS | Simple, responsive |
| Backend | Node.js + Express | RESTful API |
| Database | PostgreSQL (Supabase) | Realtime and auth support |
| Auth / OTP | Custom service or Twilio Verify | Email + WhatsApp |
| Payments | Stripe API | Secure + global |
| Hosting | Vercel (frontend), Render/Supabase (backend) | Lightweight devops |

---

## 7. User Flows

### Community Manager
1. Register via OTP (email or WhatsApp).
2. Create community profile.
3. Add session (set time, price, capacity).
4. Share link or make visible to members.
5. Track bookings, attendance, and payouts.

### Player
1. Register via OTP (email or WhatsApp).
2. Join or browse community sessions.
3. Select a session and pay.
4. Receive confirmation + reminder.
5. Attend session.

---

## 8. MVP Scope

**Included**
- OTP authentication (email + WhatsApp)
- Session management (CRUD)
- Session discovery & booking
- Stripe payment integration
- Email/WhatsApp notifications
- Manager and player dashboards

**Excluded (Future)**
- Chat and messaging
- Skill-based matching
- Gamification / leaderboards
- Subscriptions and analytics
- Multi-language support

---

## 9. Design Principles

- Mobile-first, minimal friction.
- Sporty and clean visual identity (aqua + lime palette).
- Bold typography, rounded edges.
- Primary UX rule: one tap per key action.
- Average booking flow < 10 seconds.

---

## 10. Success Metrics

| Metric | Target |
|---------|---------|
| Avg sessions per manager per week | ≥ 5 |
| Session fill rate | ≥ 80% |
| OTP verification success rate | ≥ 95% |
| Avg time to complete booking | ≤ 20s |
| Weekly active users | +20% MoM |

---

## 11. Future Enhancements

- Skill-level matching and AI recommendations.
- Loyalty and referral programs.
- Manager analytics dashboard.
- Leaderboards and seasonal rankings.
- Club chat and community features.
- Integrations with fitness trackers.

---

## 12. Next Steps

1. Set up Supabase project (DB + Auth + Storage).
2. Scaffold Express API with endpoints for:
   - Auth (OTP send/verify)
   - Sessions CRUD
   - Bookings + Payments
3. Integrate Stripe test mode.
4. Prototype mobile UI in Expo (authentication → booking flow).
5. Deploy MVP for limited community testing.

---

**End of PRD**
