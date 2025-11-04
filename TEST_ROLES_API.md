# Testing Role System APIs

## Method 1: Using the Test Script (Recommended)

### Step 1: Install axios if not already installed
```bash
cd /Users/ross/Desktop/Padel/backend
npm install axios
```

### Step 2: Update your password in the test script
Edit `test-roles-api.js` and replace `'your-password-here'` with your actual password on line 9.

### Step 3: Run the tests
```bash
node test-roles-api.js
```

### Step 4: Assign a community manager role (optional)
```bash
node test-roles-api.js assign user@example.com <community-id>
```

---

## Method 2: Using curl commands

### 1. Login to get your auth token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "ross@bloktopia.com",
    "password": "YOUR_PASSWORD_HERE"
  }'
```

**Note:** Use `identifier` (not `email`) - it accepts either email or phone number.

**Save the token from the response!** You'll need it for the next requests.

### 2. Get your roles
```bash
curl -X GET http://localhost:3000/api/roles/my-roles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "roles": [
    {
      "role_name": "super_admin",
      "community_id": null,
      "community_name": null
    }
  ],
  "is_super_admin": true
}
```

### 3. Get all roles (Super Admin only)
```bash
curl -X GET http://localhost:3000/api/roles/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "roles": [
    {
      "id": "...",
      "name": "community_manager",
      "description": "Community manager who can manage sessions and members"
    },
    {
      "id": "...",
      "name": "member",
      "description": "Regular community member"
    },
    {
      "id": "...",
      "name": "super_admin",
      "description": "Platform super administrator with full access"
    }
  ]
}
```

### 4. Get all communities
```bash
curl -X GET http://localhost:3000/api/communities \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 5. Assign community manager role to a user
```bash
curl -X POST http://localhost:3000/api/roles/assign \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "test@example.com",
    "role_name": "community_manager",
    "community_id": "COMMUNITY_ID_HERE"
  }'
```

### 6. Get managed communities for current user
```bash
curl -X GET http://localhost:3000/api/roles/managed-communities \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 7. Get community managers for a specific community
```bash
curl -X GET http://localhost:3000/api/roles/community/COMMUNITY_ID_HERE/managers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 8. Remove a role from a user
```bash
curl -X DELETE http://localhost:3000/api/roles/remove \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID_HERE",
    "role_name": "community_manager",
    "community_id": "COMMUNITY_ID_HERE"
  }'
```

---

## Method 3: Using Postman or Insomnia

1. **Import the collection** (I can create one if you'd like)
2. **Set your base URL**: `http://localhost:3000/api`
3. **Login** first to get your token
4. **Set the token** as a Bearer token in the Authorization header
5. **Test each endpoint** listed above

---

## Expected Results

### As Super Admin (ross@bloktopia.com):
- ✅ Can view all roles
- ✅ Can assign community manager roles to any user
- ✅ Can remove roles from users
- ✅ Can view all communities
- ✅ Can create sessions
- ✅ Can view all session bookings

### As Community Manager:
- ✅ Can view their managed communities
- ✅ Can create sessions for their communities
- ✅ Can view bookings for their sessions
- ✅ Can update/cancel their sessions
- ❌ Cannot assign roles to other users
- ❌ Cannot view all roles

### As Regular Member:
- ✅ Can view available sessions
- ✅ Can book sessions
- ✅ Can join communities
- ❌ Cannot create sessions
- ❌ Cannot view bookings
- ❌ Cannot assign roles

---

## Troubleshooting

### Error: "No token provided"
- Make sure you're logged in first
- Include the Authorization header: `Authorization: Bearer YOUR_TOKEN`

### Error: "Invalid or expired token"
- Your token may have expired, login again

### Error: "Super admin access required"
- Only super admins can perform this action
- Make sure you're logged in as ross@bloktopia.com

### Error: "User not found"
- The user email doesn't exist in the database
- Create the user account first via the registration flow

### Error: "community_id is required for community_manager role"
- When assigning a community manager role, you must specify which community they manage
- Get the community ID from the `/api/communities` endpoint
