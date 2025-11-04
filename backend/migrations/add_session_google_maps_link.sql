-- Add Google Maps link column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
