-- Add social media columns to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS youtube_url VARCHAR(255);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_communities_twitter ON communities(twitter_url);
CREATE INDEX IF NOT EXISTS idx_communities_instagram ON communities(instagram_url);
CREATE INDEX IF NOT EXISTS idx_communities_tiktok ON communities(tiktok_url);
CREATE INDEX IF NOT EXISTS idx_communities_facebook ON communities(facebook_url);
CREATE INDEX IF NOT EXISTS idx_communities_youtube ON communities(youtube_url);
