-- Add password_hash field to users table for password authentication
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Password can be NULL for users who haven't set it yet (legacy users)
-- Eventually we might want to make it required for new users
