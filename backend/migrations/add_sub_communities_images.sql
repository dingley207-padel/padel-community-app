-- Add banner_image column to communities table
-- Note: profile_image already exists, only adding banner_image
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS banner_image TEXT;

-- Add comment for clarity
COMMENT ON COLUMN communities.banner_image IS 'URL to the community/sub-community banner image';
