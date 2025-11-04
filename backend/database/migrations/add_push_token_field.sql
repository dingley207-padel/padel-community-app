-- Add push_token field to users table for storing Expo push notification tokens
ALTER TABLE users
ADD COLUMN IF NOT EXISTS push_token VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_push_token ON users(push_token);
