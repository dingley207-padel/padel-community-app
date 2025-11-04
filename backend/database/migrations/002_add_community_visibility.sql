-- Migration: Add visibility field to communities table
-- Purpose: Allow communities to be public or private

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS visibility BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN communities.visibility IS 'TRUE = public (visible to all), FALSE = private (invitation only)';
