-- ============================================
-- ROLES SYSTEM MIGRATION
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Platform super administrator with full access'),
  ('community_manager', 'Community manager who can manage sessions and members'),
  ('member', 'Regular community member')
ON CONFLICT (name) DO NOTHING;

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id, community_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_community_id ON user_roles(community_id);

-- Add created_by field to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add invited_by field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Create notifications_history table
CREATE TABLE IF NOT EXISTS notifications_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  recipient_type VARCHAR(50) NOT NULL,
  recipient_ids UUID[],
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_notifications_sender ON notifications_history(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_community ON notifications_history(community_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications_history(sent_at DESC);

-- Create session_attendance table
CREATE TABLE IF NOT EXISTS session_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  attended BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_session ON session_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON session_attendance(user_id);

-- Function to get user roles
CREATE OR REPLACE FUNCTION get_user_roles(p_user_id UUID)
RETURNS TABLE (
  role_name VARCHAR(50),
  community_id UUID,
  community_name VARCHAR(255)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.name as role_name,
    ur.community_id,
    c.name as community_name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  LEFT JOIN communities c ON ur.community_id = c.id
  WHERE ur.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Assign super admin role to ross@bloktopia.com
DO $$
DECLARE
  v_user_id UUID;
  v_super_admin_role_id UUID;
BEGIN
  -- Get user ID for ross@bloktopia.com
  SELECT id INTO v_user_id FROM users WHERE email = 'ross@bloktopia.com';

  -- Get super_admin role ID
  SELECT id INTO v_super_admin_role_id FROM roles WHERE name = 'super_admin';

  -- Assign super admin role if user exists
  IF v_user_id IS NOT NULL AND v_super_admin_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, community_id, assigned_by)
    VALUES (v_user_id, v_super_admin_role_id, NULL, v_user_id)
    ON CONFLICT (user_id, role_id, community_id) DO NOTHING;
  END IF;
END $$;

COMMENT ON TABLE roles IS 'System roles for access control';
COMMENT ON TABLE user_roles IS 'Maps users to their roles and communities';
COMMENT ON TABLE notifications_history IS 'History of all sent notifications';
COMMENT ON TABLE session_attendance IS 'Tracks actual attendance for sessions';
