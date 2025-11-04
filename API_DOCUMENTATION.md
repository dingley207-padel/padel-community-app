# Padel Community App - API Documentation

Base URL: `http://localhost:3000/api`

All endpoints return JSON responses.

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Error Responses

All endpoints may return these error codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

Error response format:
```json
{
  "error": "Error message",
  "details": [] // Optional validation details
}
```

---

## Auth Endpoints

### Send OTP

Send a one-time password to email or WhatsApp.

**Endpoint:** `POST /auth/send-otp`

**Request Body:**
```json
{
  "identifier": "user@example.com",  // Email or phone (+1234567890)
  "medium": "email"                   // "email" or "whatsapp"
}
```

**Response:** `200 OK`
```json
{
  "message": "OTP sent successfully",
  "medium": "email"
}
```

**Notes:**
- Phone numbers must be in E.164 format (+country code + number)
- OTP expires in 10 minutes
- Maximum 3 verification attempts per OTP

---

### Verify OTP

Verify OTP and authenticate user.

**Endpoint:** `POST /auth/verify-otp`

**Request Body:**
```json
{
  "identifier": "user@example.com",
  "code": "123456",
  "name": "John Doe"  // Optional, required for new users
}
```

**Response:** `200 OK`
```json
{
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": null,
    "role": "member",
    "profile_image": null
  }
}
```

**Notes:**
- Creates new user if identifier doesn't exist
- `name` is required for new users
- Returns JWT token valid for 7 days (configurable)

---

### Get Current User

Get authenticated user's profile.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": null,
    "role": "member",
    "profile_image": "https://...",
    "location": "New York",
    "skill_level": "intermediate"
  }
}
```

---

### Update Profile

Update authenticated user's profile.

**Endpoint:** `PUT /auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "John Smith",
  "location": "San Francisco",
  "skill_level": "advanced",
  "profile_image": "https://..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "John Smith",
    ...
  }
}
```

---

## Community Endpoints

### Get All Communities

Get list of all communities.

**Endpoint:** `GET /communities`

**Query Parameters:**
- `limit` (optional): Max results, default 50

**Response:** `200 OK`
```json
{
  "communities": [
    {
      "id": "uuid",
      "name": "Downtown Padel Club",
      "description": "Weekly padel sessions",
      "manager_id": "uuid",
      "location": "123 Main St",
      "profile_image": "https://...",
      "created_at": "2025-10-28T12:00:00Z"
    }
  ]
}
```

---

### Get Community

Get single community details.

**Endpoint:** `GET /communities/:id`

**Response:** `200 OK`
```json
{
  "community": {
    "id": "uuid",
    "name": "Downtown Padel Club",
    "description": "Weekly padel sessions",
    "manager_id": "uuid",
    "location": "123 Main St",
    "profile_image": "https://...",
    "created_at": "2025-10-28T12:00:00Z",
    "updated_at": "2025-10-28T12:00:00Z"
  }
}
```

---

### Get User's Communities

Get communities the authenticated user is a member of.

**Endpoint:** `GET /communities/my-communities`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "communities": [...]
}
```

---

### Get Manager's Communities

Get communities managed by authenticated user.

**Endpoint:** `GET /communities/manager/communities`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Response:** `200 OK`
```json
{
  "communities": [...]
}
```

---

### Create Community

Create a new community.

**Endpoint:** `POST /communities`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Downtown Padel Club",
  "description": "Weekly padel sessions in downtown",
  "location": "123 Main St, City",
  "profile_image": "https://..."  // Optional
}
```

**Response:** `201 Created`
```json
{
  "message": "Community created successfully",
  "community": {
    "id": "uuid",
    "name": "Downtown Padel Club",
    ...
  }
}
```

**Notes:**
- User's role is automatically upgraded to `manager`
- User becomes the community owner

---

### Update Community

Update community details.

**Endpoint:** `PUT /communities/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Required:** Must be the community manager

**Request Body:**
```json
{
  "name": "New Name",
  "description": "New description",
  "location": "New location",
  "profile_image": "https://..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Community updated successfully",
  "community": {...}
}
```

---

### Join Community

Join a community as a member.

**Endpoint:** `POST /communities/:id/join`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Joined community successfully"
}
```

---

### Leave Community

Leave a community.

**Endpoint:** `POST /communities/:id/leave`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Left community successfully"
}
```

---

## Session Endpoints

### Get Available Sessions

Get list of available (not full, not past) sessions.

**Endpoint:** `GET /sessions/available`

**Query Parameters:**
- `community_id` (optional): Filter by community
- `limit` (optional): Max results, default 50

**Response:** `200 OK`
```json
{
  "sessions": [
    {
      "id": "uuid",
      "community_id": "uuid",
      "title": "Evening Padel Session",
      "description": "Friendly doubles match",
      "datetime": "2025-11-01T18:00:00Z",
      "location": "Central Padel Court",
      "price": 25.00,
      "max_players": 4,
      "booked_count": 2,
      "status": "active",
      "visibility": true,
      "community_name": "Downtown Padel Club",
      "available_spots": 2
    }
  ]
}
```

---

### Get Session

Get single session details.

**Endpoint:** `GET /sessions/:id`

**Response:** `200 OK`
```json
{
  "session": {
    "id": "uuid",
    "community_id": "uuid",
    "title": "Evening Padel Session",
    ...
  }
}
```

---

### Get Manager Sessions

Get sessions for communities managed by authenticated user.

**Endpoint:** `GET /sessions/manager/sessions`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Query Parameters:**
- `status` (optional): Filter by status (active, cancelled, completed)

**Response:** `200 OK`
```json
{
  "sessions": [...]
}
```

---

### Get Session Bookings

Get bookings for a specific session.

**Endpoint:** `GET /sessions/:id/bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Required:** Must be the session's community manager

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "session_id": "uuid",
      "payment_status": "completed",
      "timestamp": "2025-10-28T12:00:00Z",
      "users": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": null
      },
      "payments": {
        "amount": 25.00,
        "platform_fee": 1.88,
        "net_amount": 23.12
      }
    }
  ]
}
```

---

### Create Session

Create a new session.

**Endpoint:** `POST /sessions`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Request Body:**
```json
{
  "community_id": "uuid",
  "title": "Evening Padel Session",
  "description": "Friendly doubles match",
  "datetime": "2025-11-01T18:00:00Z",
  "location": "Central Padel Court",
  "price": 25.00,
  "max_players": 4,
  "visibility": true  // Optional, default true
}
```

**Response:** `201 Created`
```json
{
  "message": "Session created successfully",
  "session": {
    "id": "uuid",
    "community_id": "uuid",
    "title": "Evening Padel Session",
    ...
  }
}
```

**Validation:**
- `price` must be >= 0
- `max_players` must be > 0
- `datetime` must be in ISO 8601 format
- Must own the community

---

### Update Session

Update session details.

**Endpoint:** `PUT /sessions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Required:** Must be the session's community manager

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "datetime": "2025-11-02T18:00:00Z",
  "location": "New location",
  "price": 30.00,
  "max_players": 6,
  "visibility": false
}
```

**Response:** `200 OK`
```json
{
  "message": "Session updated successfully",
  "session": {...}
}
```

**Notes:**
- Cannot update `booked_count` directly
- Increasing `max_players` is allowed
- Decreasing below current `booked_count` will fail

---

### Cancel Session

Cancel a session.

**Endpoint:** `DELETE /sessions/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Required Role:** `manager`

**Required:** Must be the session's community manager

**Response:** `200 OK`
```json
{
  "message": "Session cancelled successfully"
}
```

**Notes:**
- Sets session status to `cancelled`
- Should trigger notifications to all booked users (TODO)
- Does not automatically refund bookings

---

## Booking Endpoints

### Get User Bookings

Get authenticated user's bookings.

**Endpoint:** `GET /bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "bookings": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "session_id": "uuid",
      "payment_status": "completed",
      "timestamp": "2025-10-28T12:00:00Z",
      "cancelled_at": null,
      "sessions": {
        "id": "uuid",
        "title": "Evening Padel Session",
        "datetime": "2025-11-01T18:00:00Z",
        "location": "Central Court",
        "price": 25.00,
        "communities": {
          "name": "Downtown Padel Club",
          "location": "123 Main St"
        }
      },
      "payments": {
        "amount": 25.00,
        "status": "completed",
        "stripe_txn_id": "pi_..."
      }
    }
  ]
}
```

---

### Create Booking

Book a session and process payment.

**Endpoint:** `POST /bookings`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "session_id": "uuid",
  "payment_method_id": "pm_..."  // Stripe Payment Method ID
}
```

**Response:** `201 Created`
```json
{
  "message": "Booking successful",
  "booking": {
    "id": "uuid",
    "user_id": "uuid",
    "session_id": "uuid",
    "payment_status": "completed",
    "timestamp": "2025-10-28T12:00:00Z"
  },
  "payment": {
    "id": "uuid",
    "booking_id": "uuid",
    "amount": 25.00,
    "platform_fee": 1.88,
    "net_amount": 23.12,
    "status": "completed",
    "stripe_txn_id": "pi_..."
  }
}
```

**Validation:**
- Session must be active
- Session must not be full
- Session must be in the future
- User cannot book same session twice
- Payment must succeed

**Notes:**
- Atomically increments `booked_count`
- If payment fails, booking is rolled back
- Platform fee is automatically calculated and deducted

---

### Cancel Booking

Cancel a booking and process refund.

**Endpoint:** `DELETE /bookings/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "message": "Booking cancelled successfully"
}
```

**Validation:**
- Must be your booking
- Must be at least 24 hours before session (configurable)
- Booking must not already be cancelled

**Notes:**
- Automatically processes Stripe refund
- Atomically decrements `booked_count`
- Updates payment status to `refunded`

---

## Rate Limiting

Consider implementing rate limiting for production:
- OTP endpoints: 5 requests per 15 minutes per IP
- Auth endpoints: 10 requests per minute per IP
- General endpoints: 100 requests per minute per user

## Pagination

For endpoints returning lists, consider adding pagination:
```
GET /sessions/available?page=1&limit=20
```

Response:
```json
{
  "sessions": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

## Webhooks

### Stripe Webhooks

**Endpoint:** `POST /webhooks/stripe` (to be implemented)

Listen for Stripe events:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## Testing

### Test Mode

All endpoints work in test mode with:
- Stripe test keys
- Test payment methods
- Mock OTP codes (check database)

### Test Cards

Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Authentication required: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC works.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Send OTP
const response = await fetch('http://localhost:3000/api/auth/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    medium: 'email'
  })
});

// Verify OTP
const authResponse = await fetch('http://localhost:3000/api/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    identifier: 'user@example.com',
    code: '123456',
    name: 'John Doe'
  })
});
const { token } = await authResponse.json();

// Use authenticated endpoint
const sessionsResponse = await fetch('http://localhost:3000/api/sessions/available', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### cURL

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","medium":"email"}'

# Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","code":"123456","name":"John Doe"}'

# Get sessions (authenticated)
curl http://localhost:3000/api/sessions/available \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

For more information, see:
- [README.md](README.md) - Main documentation
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Setup instructions
- [PRD.md](PRD.md) - Product requirements
