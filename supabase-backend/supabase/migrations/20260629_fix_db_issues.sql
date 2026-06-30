-- 1. Create the missing notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Row Level Security (RLS) for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = recipient_email);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = recipient_email);
CREATE POLICY "Authenticated users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 3. Add missing Row Level Security (RLS) policies for presence
-- Allow authenticated users to view all presence records
CREATE POLICY "Public can read presence" ON presence FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to upsert their own presence
CREATE POLICY "Users can insert their own presence" ON presence FOR INSERT WITH CHECK (auth.uid()::text = user_email);
CREATE POLICY "Users can update their own presence" ON presence FOR UPDATE USING (auth.uid()::text = user_email);
