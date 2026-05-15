-- Seed data for Bulletin Board Supabase backend
-- This file contains initial data for development and testing

-- Insert some sample users
INSERT INTO users (email, role, bio, primary_ecosystem, onboarded, status, posts_this_month, plan, followers_count, following_count) VALUES
('admin@bulletinboard.com', 'admin', 'Administrator of Bulletin Board', 'technology', true, 'active', 0, 'pro', 0, 0),
('user1@bulletinboard.com', 'user', 'Regular user interested in tech', 'technology', true, 'active', 2, 'free', 5, 3),
('user2@bulletinboard.com', 'user', 'Healthcare professional', 'healthcare', true, 'active', 1, 'free', 2, 1);

-- Insert sample workspaces
INSERT INTO workspaces (name, ecosystem, owner_email, member_count, plan) VALUES
('Tech Community', 'technology', 'admin@bulletinboard.com', 3, 'pro'),
('Healthcare Hub', 'healthcare', 'user2@bulletinboard.com', 1, 'free');

-- Insert sample posts
INSERT INTO posts (title, body, flair, ecosystem, upvotes, downvotes, vote_score, author_name, author_email, comment_count) VALUES
('Welcome to Bulletin Board!', 'This is our first post. Welcome to the community!', 'announcement', 'technology', 10, 0, 10, 'Admin', 'admin@bulletinboard.com', 2),
('Latest Tech Trends', 'What are the biggest technology trends for 2024?', 'discussion', 'technology', 5, 1, 4, 'Tech User', 'user1@bulletinboard.com', 3),
('Healthcare Innovation', 'Discussing new innovations in healthcare technology.', 'discussion', 'healthcare', 3, 0, 3, 'Health Pro', 'user2@bulletinboard.com', 1);

-- Insert sample comments
INSERT INTO comments (post_id, author_email, author_name, body) VALUES
((SELECT id FROM posts WHERE title = 'Welcome to Bulletin Board!' LIMIT 1), 'user1@bulletinboard.com', 'Tech User', 'Great to be here!'),
((SELECT id FROM posts WHERE title = 'Welcome to Bulletin Board!' LIMIT 1), 'user2@bulletinboard.com', 'Health Pro', 'Looking forward to the discussions!'),
((SELECT id FROM posts WHERE title = 'Latest Tech Trends' LIMIT 1), 'admin@bulletinboard.com', 'Admin', 'AI and quantum computing are big ones.');

-- Insert sample channels
INSERT INTO channels (name, workspace_id, type, description) VALUES
('general', (SELECT id FROM workspaces WHERE name = 'Tech Community' LIMIT 1), 'public', 'General discussion'),
('tech-news', (SELECT id FROM workspaces WHERE name = 'Tech Community' LIMIT 1), 'public', 'Technology news and updates'),
('health-discussion', (SELECT id FROM workspaces WHERE name = 'Healthcare Hub' LIMIT 1), 'public', 'Healthcare discussions');

-- Insert sample subscriptions
INSERT INTO subscriptions (user_email, plan, trial_started_date, trial_end_date) VALUES
('user1@bulletinboard.com', 'free', NOW(), NOW() + INTERVAL '14 days'),
('user2@bulletinboard.com', 'free', NOW(), NOW() + INTERVAL '14 days');

-- Insert sample follows
INSERT INTO follows (follower_email, following_email) VALUES
('user1@bulletinboard.com', 'user2@bulletinboard.com'),
('user2@bulletinboard.com', 'user1@bulletinboard.com');