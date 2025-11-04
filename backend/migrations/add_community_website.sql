-- Add website URL column to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS website_url TEXT;
