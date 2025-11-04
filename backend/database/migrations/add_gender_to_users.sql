-- Add gender field to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Optional: Add a check constraint for valid values
ALTER TABLE users
ADD CONSTRAINT check_gender CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say') OR gender IS NULL);
