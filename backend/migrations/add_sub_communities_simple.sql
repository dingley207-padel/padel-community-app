-- Add parent_community_id to communities table for hierarchical structure
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS parent_community_id UUID REFERENCES communities(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_communities_parent_id ON communities(parent_community_id);

-- Add comment for clarity
COMMENT ON COLUMN communities.parent_community_id IS 'References parent community for sub-communities. NULL for parent communities. Only 1-level nesting allowed (enforced by application logic).';
