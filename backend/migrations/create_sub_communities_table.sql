-- Create sub_communities table
CREATE TABLE IF NOT EXISTS sub_communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  emoji VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add sub_community_id column to community_members table
ALTER TABLE community_members
ADD COLUMN IF NOT EXISTS sub_community_id UUID REFERENCES sub_communities(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sub_communities_community_id ON sub_communities(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_sub_community_id ON community_members(sub_community_id);

-- Add comments for clarity
COMMENT ON TABLE sub_communities IS 'Sub-groups within communities (e.g., Beginners, Intermediate, Advanced)';
COMMENT ON COLUMN community_members.sub_community_id IS 'Optional sub-community assignment for members';
