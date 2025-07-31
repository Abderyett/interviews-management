# Chat System Database Setup

## Required Supabase Tables

To enable the chat functionality, you need to run the SQL script `chat_schema.sql` in your Supabase database.

### How to setup:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `chat_schema.sql`**
4. **Run the SQL script**

This will create:
- `chat_users` table - stores user information and online status
- `chat_messages` table - stores all chat messages
- Proper indexes for performance
- Row Level Security policies
- Real-time subscriptions setup

### Tables Created:

#### chat_users
- `id` (UUID, Primary Key)
- `user_id` (TEXT, Unique) - matches the user IDs from the application
- `name` (TEXT) - display name
- `role` (TEXT) - 'superadmin', 'receptionist', or 'professor'
- `online` (BOOLEAN) - current online status
- `last_seen` (TIMESTAMP) - when user was last active
- `created_at` (TIMESTAMP)

#### chat_messages
- `id` (UUID, Primary Key)
- `sender_id` (TEXT) - ID of message sender
- `sender_name` (TEXT) - display name of sender
- `sender_role` (TEXT) - role of sender
- `content` (TEXT) - message content
- `message_type` (TEXT) - 'broadcast' or 'direct'
- `recipient_id` (TEXT, Nullable) - for direct messages
- `created_at` (TIMESTAMP)

### Features:
- ✅ Real-time messaging with Supabase subscriptions
- ✅ User online/offline status tracking
- ✅ Both broadcast and direct messaging
- ✅ Message history persistence
- ✅ Role-based user identification
- ✅ Automatic cleanup on user disconnect