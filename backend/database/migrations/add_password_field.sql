-- Migration: Add password field to users table
-- This supports the new registration flow where users set passwords

ALTER TABLE users
ADD COLUMN password_hash VARCHAR(255);

-- Make password_hash required for new users (existing users will need to set it)
-- We don't add NOT NULL constraint yet to support existing users
