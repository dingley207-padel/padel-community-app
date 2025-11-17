-- Add duration_minutes column to sessions table
ALTER TABLE sessions
ADD COLUMN duration_minutes INTEGER DEFAULT 90;

-- Add a comment to explain the field
COMMENT ON COLUMN sessions.duration_minutes IS 'Duration of the session in minutes';
