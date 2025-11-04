-- Migration: Create pending_registrations table
-- Purpose: Store user registration data temporarily until OTP is verified
-- This prevents creating unverified users in the main users table

CREATE TABLE IF NOT EXISTS pending_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    CONSTRAINT unique_pending_email UNIQUE(email),
    CONSTRAINT unique_pending_phone UNIQUE(phone)
);

-- Index for faster lookups
CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
CREATE INDEX idx_pending_registrations_phone ON pending_registrations(phone);
CREATE INDEX idx_pending_registrations_expires ON pending_registrations(expires_at);

-- Function to automatically clean up expired pending registrations
CREATE OR REPLACE FUNCTION cleanup_expired_pending_registrations()
RETURNS void AS $$
BEGIN
    DELETE FROM pending_registrations
    WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule this function to run periodically
-- (You can set up a cron job or use pg_cron extension)
