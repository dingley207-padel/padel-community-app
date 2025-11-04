# Database Migration Guide

## Adding password_hash Column to Users Table

To support the new registration flow with passwords, you need to add the `password_hash` column to your `users` table in Supabase.

## Steps to Run the Migration

### Option 1: Using Supabase Dashboard (Recommended - Easiest)

1. **Open your Supabase Dashboard**
   - Go to [https://app.supabase.com](https://app.supabase.com)
   - Select your Padel project

2. **Navigate to SQL Editor**
   - Click on **"SQL Editor"** in the left sidebar
   - Click **"New Query"**

3. **Run the Migration SQL**
   - Copy and paste this SQL:
   ```sql
   ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
   ```
   - Click **"Run"** or press `Ctrl/Cmd + Enter`

4. **Verify Success**
   - You should see a success message
   - The `password_hash` column is now added to your `users` table

### Option 2: Using the Check Migration Script

We've created a script that checks if the migration is needed:

```bash
cd backend
npm run check-migration
```

**If the column doesn't exist**, the script will show you the SQL to run:
```
❌ Column password_hash does NOT exist yet.

📝 Please run this SQL in your Supabase SQL Editor:

------------------------------------------------------------
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
------------------------------------------------------------
```

**If the column already exists**, you'll see:
```
✅ Column password_hash already exists!
✅ Database is ready for the new registration flow.
```

## Verification

After running the migration, verify it worked by:

1. Running the check script again:
   ```bash
   npm run check-migration
   ```

2. Or checking in Supabase Dashboard:
   - Go to **Table Editor**
   - Select **users** table
   - Look for the **password_hash** column

## Migration File Location

The migration SQL is stored at:
- `backend/database/migrations/add_password_field.sql`

## What This Does

This migration adds a new column to store hashed passwords for user accounts. The column:
- **Name**: `password_hash`
- **Type**: `VARCHAR(255)`
- **Nullable**: Yes (to support existing users without passwords)
- **Purpose**: Store bcrypt-hashed passwords securely

## Next Steps

Once the migration is complete:
1. Start your backend: `cd backend && npm run dev`
2. Start your frontend: `cd frontend && npm start`
3. Test the new registration flow!

## Troubleshooting

**Error: "column already exists"**
- This means the migration was already run successfully. You're good to go!

**Error: "permission denied"**
- Make sure you're using the Supabase service key (not anon key) in your `.env` file
- Or run the SQL directly in the Supabase dashboard where you have full permissions

**Error: "relation users does not exist"**
- Run the main schema first: `backend/database/schema.sql`
