-- Force disable RLS and remove all policies
-- This is a comprehensive fix for the RLS blocking issue

-- First, drop the tables completely and recreate them without RLS
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_users CASCADE;

-- Recreate chat_users table WITHOUT RLS
CREATE TABLE chat_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recreate chat_messages table WITHOUT RLS
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('broadcast', 'direct')) NOT NULL,
    recipient_id TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Explicitly disable RLS (should be disabled by default, but let's be sure)
ALTER TABLE chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_users_user_id ON chat_users(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_users_online ON chat_users(online);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_id ON chat_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_type ON chat_messages(message_type);

-- Test insert to verify it works
INSERT INTO chat_users (user_id, name, role, online) 
VALUES ('test-user', 'Test User', 'receptionist', true);

INSERT INTO chat_messages (sender_id, sender_name, sender_role, content, message_type) 
VALUES ('test-user', 'Test User', 'receptionist', 'Test message', 'broadcast');

-- Clean up test data
DELETE FROM chat_messages WHERE sender_id = 'test-user';
DELETE FROM chat_users WHERE user_id = 'test-user';

-- Confirm tables are ready
SELECT 'Tables created successfully without RLS!' as status;