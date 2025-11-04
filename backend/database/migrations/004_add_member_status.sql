-- Add status field to community_members table
CREATE TYPE member_status AS ENUM ('active', 'suspended', 'revoked');

ALTER TABLE community_members
ADD COLUMN status member_status DEFAULT 'active',
ADD COLUMN status_updated_at TIMESTAMP,
ADD COLUMN status_updated_by UUID REFERENCES users(id),
ADD COLUMN status_reason TEXT;

-- Add index for filtering by status
CREATE INDEX idx_community_members_status ON community_members(status);
CREATE INDEX idx_community_members_community ON community_members(community_id);
