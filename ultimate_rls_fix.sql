-- Ultimate RLS fix - run this in Supabase SQL Editor
-- This will completely remove RLS and make tables publicly accessible

-- Drop tables and recreate with explicit permissions
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_users CASCADE;

-- Create tables with explicit permissions
CREATE TABLE public.chat_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT CHECK (sender_role IN ('superadmin', 'receptionist', 'professor')) NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('broadcast', 'direct')) NOT NULL,
    recipient_id TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure RLS is disabled
ALTER TABLE public.chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon and authenticated roles
GRANT ALL ON public.chat_users TO anon;
GRANT ALL ON public.chat_messages TO anon;
GRANT ALL ON public.chat_users TO authenticated;
GRANT ALL ON public.chat_messages TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create indexes
CREATE INDEX idx_chat_users_user_id ON public.chat_users(user_id);
CREATE INDEX idx_chat_users_online ON public.chat_users(online);
CREATE INDEX idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX idx_chat_messages_recipient_id ON public.chat_messages(recipient_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_type ON public.chat_messages(message_type);

-- Test that everything works
INSERT INTO public.chat_users (user_id, name, role, online) 
VALUES ('test-setup', 'Setup Test', 'receptionist', true);

INSERT INTO public.chat_messages (sender_id, sender_name, sender_role, content, message_type) 
VALUES ('test-setup', 'Setup Test', 'receptionist', 'Setup test message', 'broadcast');

-- Verify data was inserted
SELECT COUNT(*) as user_count FROM public.chat_users WHERE user_id = 'test-setup';
SELECT COUNT(*) as message_count FROM public.chat_messages WHERE sender_id = 'test-setup';

-- Clean up test data
DELETE FROM public.chat_messages WHERE sender_id = 'test-setup';
DELETE FROM public.chat_users WHERE user_id = 'test-setup';

SELECT 'Chat tables setup complete with full permissions!' as result;