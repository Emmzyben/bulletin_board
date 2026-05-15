-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    recipient_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    sender_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    message TEXT,
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for recipient_email to speed up notification fetching
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_email ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = recipient_email);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid()::text = recipient_email);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true); -- Simplified for now
