-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE,
  display_name VARCHAR(100),
  bio TEXT,
  profile_photo_url TEXT,
  banner_type VARCHAR(50) DEFAULT 'gradient',
  banner_value TEXT DEFAULT 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
  accent_color VARCHAR(20) DEFAULT '#007AFF',
  date_of_birth DATE,
  age_tier VARCHAR(20),
  profile_complete BOOLEAN DEFAULT false,
  theme_preference VARCHAR(20) DEFAULT 'dark',
  language_preference VARCHAR(10) DEFAULT 'en',
  chat_permission VARCHAR(20) DEFAULT 'everyone',
  is_private BOOLEAN DEFAULT false,
  notifications_messages BOOLEAN DEFAULT true,
  notifications_twin BOOLEAN DEFAULT true,
  notifications_email BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Twin Personality table
CREATE TABLE ai_twin_personality (
  twin_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  personality_description TEXT,
  energy_tags JSONB DEFAULT '[]',
  vibe_tags JSONB DEFAULT '[]',
  interests JSONB DEFAULT '[]',
  style_description TEXT,
  texting_style JSONB DEFAULT '{}',
  texting_description TEXT,
  loves_topics JSONB DEFAULT '[]',
  dislikes_topics JSONB DEFAULT '[]',
  boundary_response VARCHAR(100),
  conversation_style JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  conversation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  ai_twin_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, ai_twin_user_id)
);

-- Messages table
CREATE TABLE messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  sent_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT false,
  moderation_status VARCHAR(50) DEFAULT 'clean'
);

-- Reports table
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(conversation_id),
  report_type VARCHAR(50),
  report_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'pending'
);

-- Blocks table
CREATE TABLE blocks (
  block_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

-- Feedback table
CREATE TABLE feedback (
  feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bug reports table
CREATE TABLE bug_reports (
  bug_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'open'
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_twin_personality ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI Twin
CREATE POLICY "Anyone can view twin personality" ON ai_twin_personality FOR SELECT USING (true);
CREATE POLICY "Owner can modify twin" ON ai_twin_personality FOR ALL USING (auth.uid() = user_id);

-- Conversations
CREATE POLICY "Users see own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id OR auth.uid() = ai_twin_user_id);
CREATE POLICY "Users create conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "Participants see messages" ON messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversations WHERE user_id = auth.uid() OR ai_twin_user_id = auth.uid())
);
CREATE POLICY "Users insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Blocks
CREATE POLICY "Users manage own blocks" ON blocks FOR ALL USING (auth.uid() = blocker_id);
CREATE POLICY "Users see blocks involving them" ON blocks FOR SELECT USING (auth.uid() = blocker_id OR auth.uid() = blocked_id);

-- Reports
CREATE POLICY "Users create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Feedback
CREATE POLICY "Users create feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Twin owners see their feedback" ON feedback FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversations WHERE ai_twin_user_id = auth.uid())
);

-- Bug reports
CREATE POLICY "Users create bug reports" ON bug_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
