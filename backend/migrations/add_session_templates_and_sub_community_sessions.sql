-- Migration: Add session templates and sub-community support for sessions
-- This enables recurring weekly sessions and links sessions to specific sub-community locations

-- 1. Add sub_community_id to sessions table
ALTER TABLE sessions
ADD COLUMN sub_community_id UUID REFERENCES communities(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX idx_sessions_sub_community_id ON sessions(sub_community_id);

-- Add comment
COMMENT ON COLUMN sessions.sub_community_id IS 'References the sub-community (location) where this session takes place. Can be NULL for legacy sessions or parent-community-wide sessions.';


-- 2. Create session_templates table for recurring sessions
CREATE TABLE session_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  sub_community_id UUID REFERENCES communities(id) ON DELETE CASCADE,

  -- Template details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  time_of_day TIME NOT NULL, -- e.g., '19:00:00' for 7 PM
  duration_minutes INTEGER DEFAULT 90,

  -- Session settings
  price DECIMAL(10, 2) NOT NULL,
  max_players INTEGER NOT NULL,
  free_cancellation_hours INTEGER DEFAULT 24,
  allow_conditional_cancellation BOOLEAN DEFAULT true,

  -- Template status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_session_templates_community_id ON session_templates(community_id);
CREATE INDEX idx_session_templates_sub_community_id ON session_templates(sub_community_id);
CREATE INDEX idx_session_templates_day_of_week ON session_templates(day_of_week);
CREATE INDEX idx_session_templates_is_active ON session_templates(is_active);

-- Add comments
COMMENT ON TABLE session_templates IS 'Defines recurring weekly session patterns for easy bulk creation';
COMMENT ON COLUMN session_templates.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN session_templates.time_of_day IS 'Time when the session starts (24-hour format)';
COMMENT ON COLUMN session_templates.is_active IS 'Whether this template is currently active and should appear in bulk creation lists';


-- 3. Add tracking for template-created sessions (optional, for analytics)
ALTER TABLE sessions
ADD COLUMN created_from_template_id UUID REFERENCES session_templates(id) ON DELETE SET NULL;

CREATE INDEX idx_sessions_template_id ON sessions(created_from_template_id);

COMMENT ON COLUMN sessions.created_from_template_id IS 'References the template used to create this session, if applicable. Useful for analytics and tracking.';


-- 4. Update the available_sessions view to include sub_community info
DROP VIEW IF EXISTS available_sessions;

CREATE VIEW available_sessions AS
SELECT
  s.*,
  c.name as community_name,
  c.location as community_location,
  sc.name as sub_community_name,
  sc.location as sub_community_location
FROM sessions s
JOIN communities c ON s.community_id = c.id
LEFT JOIN communities sc ON s.sub_community_id = sc.id
WHERE s.status = 'active'
  AND s.visibility = true
  AND s.datetime > NOW();

COMMENT ON VIEW available_sessions IS 'Shows all available sessions with community and sub-community details';
