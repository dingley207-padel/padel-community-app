-- Create friendships/follows table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure a user can't send multiple requests to the same person
  UNIQUE(requester_id, addressee_id),

  -- Ensure a user can't friend themselves
  CHECK (requester_id != addressee_id),

  -- Status can be: pending, accepted, rejected, blocked
  CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- Create a composite index for common queries (get all friends of a user)
CREATE INDEX IF NOT EXISTS idx_friendships_users_status
  ON friendships(requester_id, addressee_id, status);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendships_updated_at();
