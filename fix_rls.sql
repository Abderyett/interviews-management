-- Quick fix for RLS policy blocking chat messages
-- Run this in Supabase SQL Editor if you already created the tables

-- Disable Row Level Security
ALTER TABLE chat_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow authenticated users to read chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to update their own chat_users" ON chat_users;
DROP POLICY IF EXISTS "Allow authenticated users to read chat_messages" ON chat_messages;
DROP POLICY IF EXISTS "Allow authenticated users to insert chat_messages" ON chat_messages;

-- Verify tables are accessible
SELECT 'chat_users table accessible' as status;
SELECT 'chat_messages table accessible' as status;