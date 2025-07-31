-- Chat Users Table
CREATE TABLE IF NOT EXISTS chat_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('broadcast', 'direct')) NOT NULL,
    recipient_id TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security for now to allow all operations
-- You can re-enable later with proper authentication if needed
ALTER TABLE chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to read chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat_messages" ON chat_messages;

-- Alternative: If you want to keep RLS enabled, use these permissive policies instead:
-- ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all operations on chat_users" ON chat_users
--     FOR ALL USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow all operations on chat_messages" ON chat_messages  
--     FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_users_user_id ON chat_users(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_online ON chat_users(online);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);

-- Trigger to update last_seen when user goes online
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.online = true AND OLD.online = false THEN
        NEW.last_seen = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_last_seen
    BEFORE UPDATE ON chat_users
    FOR EACH ROW
    EXECUTE FUNCTION update_last_seen();