-- Drop the old 1-on-1 conversation tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Create community_chats table (one chat per community)
CREATE TABLE IF NOT EXISTS community_chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(community_id)
);

-- Create messages table for community group chat
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT non_empty_content CHECK (length(trim(content)) > 0)
);

-- Create indexes for better performance
CREATE INDEX idx_community_messages_community ON community_messages(community_id);
CREATE INDEX idx_community_messages_created_at ON community_messages(created_at DESC);
CREATE INDEX idx_community_messages_sender ON community_messages(sender_id);

-- Create function to auto-update community_chats updated_at timestamp
CREATE OR REPLACE FUNCTION update_community_chat_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO community_chats (community_id, updated_at)
    VALUES (NEW.community_id, NEW.created_at)
    ON CONFLICT (community_id)
    DO UPDATE SET updated_at = NEW.created_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update community_chats when new message is sent
DROP TRIGGER IF EXISTS update_community_chat_on_message ON community_messages;
CREATE TRIGGER update_community_chat_on_message
    AFTER INSERT ON community_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_community_chat_timestamp();
