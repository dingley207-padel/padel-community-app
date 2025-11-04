-- Migration: Add cancellation policy features
-- Date: 2025-10-29

-- Create cancellation status enum
CREATE TYPE cancellation_status AS ENUM ('confirmed', 'pending_replacement', 'cancelled');

-- Add fields to bookings table for cancellation tracking
ALTER TABLE bookings
ADD COLUMN cancellation_status cancellation_status DEFAULT 'confirmed',
ADD COLUMN cancellation_requested_at TIMESTAMP,
ADD COLUMN refund_status VARCHAR(50),
ADD COLUMN refund_amount DECIMAL(10, 2),
ADD COLUMN replaced_by_user_id UUID REFERENCES users(id);

-- Create waitlist table for people who want to join when spot opens
CREATE TABLE IF NOT EXISTS session_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_waitlist_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notified_at TIMESTAMP,
    expired_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'waiting', -- waiting, notified, expired, taken
    UNIQUE(session_id, user_id)
);

-- Create index for faster waitlist queries
CREATE INDEX idx_waitlist_session_status ON session_waitlist(session_id, status);
CREATE INDEX idx_bookings_cancellation_status ON bookings(cancellation_status);

-- Add sessions configuration for cancellation policy
ALTER TABLE sessions
ADD COLUMN free_cancellation_hours INTEGER DEFAULT 24,
ADD COLUMN allow_conditional_cancellation BOOLEAN DEFAULT TRUE;

-- Add comment for documentation
COMMENT ON COLUMN bookings.cancellation_status IS 'confirmed: active booking, pending_replacement: waiting for someone to take spot, cancelled: fully cancelled';
COMMENT ON COLUMN sessions.free_cancellation_hours IS 'Hours before session when free cancellation is allowed';
COMMENT ON COLUMN sessions.allow_conditional_cancellation IS 'Allow users to request cancellation with refund pending replacement';
