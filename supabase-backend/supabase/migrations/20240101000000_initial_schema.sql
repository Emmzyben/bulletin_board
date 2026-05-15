-- Create the database schema for Bulletin Board based on Base44 entities

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    bio TEXT,
    location VARCHAR(255),
    primary_ecosystem VARCHAR(100) CHECK (primary_ecosystem IN (
        'technology', 'healthcare', 'corporate', 'education', 'government',
        'real_estate', 'hospitality', 'careers', 'entertainment'
    )),
    karma INTEGER DEFAULT 0,
    workspace_id VARCHAR(255),
    onboarded BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'away', 'dnd', 'ooo')),
    avatar_url VARCHAR(500),
    posts_this_month INTEGER DEFAULT 0,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE workspaces (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    ecosystem VARCHAR(100) CHECK (ecosystem IN (
        'technology', 'healthcare', 'corporate', 'education', 'government',
        'real_estate', 'hospitality', 'careers', 'entertainment'
    )),
    owner_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    member_count INTEGER DEFAULT 1,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    members JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts table
CREATE TABLE posts (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    title VARCHAR(500) NOT NULL,
    body TEXT,
    flair VARCHAR(100) CHECK (flair IN (
        'discussion', 'news', 'question', 'resource', 'job', 'insight',
        'announcement', 'poll'
    )),
    ecosystem VARCHAR(100) CHECK (ecosystem IN (
        'technology', 'healthcare', 'corporate', 'education', 'government',
        'real_estate', 'hospitality', 'careers', 'entertainment'
    )),
    image_url VARCHAR(500),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    vote_score INTEGER DEFAULT 0,
    author_name VARCHAR(255),
    author_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    comment_count INTEGER DEFAULT 0,
    poll_options JSONB,
    saves_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    parent_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
    author_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    author_name VARCHAR(255),
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Channels table
CREATE TABLE channels (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'public' CHECK (type IN ('public', 'private', 'b2b')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    content TEXT NOT NULL,
    channel_id VARCHAR(255) REFERENCES channels(id) ON DELETE CASCADE,
    workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    sender_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    sender_name VARCHAR(255),
    is_dm BOOLEAN DEFAULT FALSE,
    dm_recipient VARCHAR(255),
    reactions JSONB DEFAULT '[]'::jsonb,
    file_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    voter_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (post_id, voter_email)
);

-- Reactions table
CREATE TABLE reactions (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    comment_id VARCHAR(255) REFERENCES comments(id) ON DELETE CASCADE,
    emoji VARCHAR(50) NOT NULL,
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, comment_id, emoji, user_email)
);

-- Follows table
CREATE TABLE follows (
    follower_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    following_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_email, following_email),
    CHECK (follower_email != following_email)
);

-- Saved posts table
CREATE TABLE saved_posts (
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    post_id VARCHAR(255) REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_email, post_id)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    user_email VARCHAR(255) PRIMARY KEY REFERENCES users(email) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
    trial_started_date TIMESTAMP WITH TIME ZONE,
    trial_end_date TIMESTAMP WITH TIME ZONE,
    pro_since_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Presence table
CREATE TABLE presence (
    user_email VARCHAR(255) REFERENCES users(email) ON DELETE CASCADE,
    user_name VARCHAR(255),
    workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    channel_id VARCHAR(255) REFERENCES channels(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'online' CHECK (status IN ('online', 'away', 'offline')),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_read JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_email, workspace_id)
);

-- B2B Spaces table
CREATE TABLE b2b_spaces (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    company_name VARCHAR(255) NOT NULL,
    admin_email VARCHAR(255) REFERENCES users(email) ON DELETE SET NULL,
    relationship_type VARCHAR(50) CHECK (relationship_type IN (
        'client', 'partner', 'investor', 'vendor'
    )),
    workspace_id VARCHAR(255) REFERENCES workspaces(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
    shared_channels JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_posts_author_email ON posts(author_email);
CREATE INDEX idx_posts_ecosystem ON posts(ecosystem);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_messages_channel_id ON messages(channel_id);
CREATE INDEX idx_messages_sender_email ON messages(sender_email);
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX idx_channels_workspace_id ON channels(workspace_id);
CREATE INDEX idx_b2b_spaces_workspace_id ON b2b_spaces(workspace_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON presence FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_b2b_spaces_updated_at BEFORE UPDATE ON b2b_spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_spaces ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these can be customized based on your auth requirements)
-- For now, allowing authenticated users to read/write their own data
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid()::text = email);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid()::text = email);

-- Public read access for posts (as per the original getPublicPosts function)
CREATE POLICY "Public can read posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Comments policies
CREATE POLICY "Public can read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- And so on... (additional policies would be added based on specific requirements)