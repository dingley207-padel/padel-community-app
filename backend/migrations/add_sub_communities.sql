-- Add parent_community_id to communities table for hierarchical structure
ALTER TABLE communities
ADD COLUMN parent_community_id UUID REFERENCES communities(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX idx_communities_parent_id ON communities(parent_community_id);

-- Add a check constraint to prevent deep nesting (only 1 level)
-- This ensures we only have parent -> child, not parent -> child -> grandchild
ALTER TABLE communities
ADD CONSTRAINT check_no_deep_nesting
CHECK (
  parent_community_id IS NULL
  OR
  (SELECT parent_community_id FROM communities WHERE id = parent_community_id) IS NULL
);

-- Add comment for clarity
COMMENT ON COLUMN communities.parent_community_id IS 'References parent community for sub-communities. NULL for parent communities.';
