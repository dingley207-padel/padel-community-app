-- Add community_owner role to the roles table
INSERT INTO roles (name, description) VALUES
  ('community_owner', 'Community owner who can manage sessions, members, and assign community managers')
ON CONFLICT (name) DO NOTHING;

-- Update existing community managers to community owners
-- This upgrades all current community_manager roles to community_owner roles
-- You can skip this step if you want to manually assign owners
DO $$
DECLARE
  v_owner_role_id UUID;
  v_manager_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_owner_role_id FROM roles WHERE name = 'community_owner';
  SELECT id INTO v_manager_role_id FROM roles WHERE name = 'community_manager';

  -- Update existing community managers to owners
  -- This assumes your current managers should become owners
  UPDATE user_roles
  SET role_id = v_owner_role_id
  WHERE role_id = v_manager_role_id
  AND community_id IS NOT NULL;

  -- Log the change
  RAISE NOTICE 'Upgraded existing community managers to community owners';
END $$;

COMMENT ON TABLE roles IS 'System roles: super_admin (platform admin), community_owner (owns community, can assign managers), community_manager (can manage sessions), member (regular user)';
