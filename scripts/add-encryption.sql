-- Add E2E encryption support

-- Add PIN verifier to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_verifier TEXT;

-- Add encrypted flag to messages (content is already TEXT, will store encrypted blobs)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted BOOLEAN NOT NULL DEFAULT false;

-- Index for cleaning up old messages
CREATE INDEX IF NOT EXISTS idx_messages_created_at_for_cleanup 
ON messages(created_at) 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Function to clean up old messages (run daily via cron)
-- This deletes messages older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM messages 
  WHERE created_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Also clean up empty conversations (no messages left)
CREATE OR REPLACE FUNCTION cleanup_empty_conversations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM conversations c
  WHERE NOT EXISTS (
    SELECT 1 FROM messages m WHERE m.conversation_id = c.id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
