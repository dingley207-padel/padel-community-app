-- Migration: Fix booking unique constraint to allow rebooking after cancellation
-- Date: 2025-10-29

-- Drop the old unique constraint that prevents rebooking
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_user_id_session_id_key;

-- Add a partial unique index that only applies to non-cancelled bookings
-- This allows users to rebook after cancelling
CREATE UNIQUE INDEX IF NOT EXISTS bookings_user_session_active_unique
ON bookings(user_id, session_id)
WHERE cancelled_at IS NULL;

-- Add comment for documentation
COMMENT ON INDEX bookings_user_session_active_unique IS 'Ensures a user can only have one active booking per session, but allows rebooking after cancellation';
