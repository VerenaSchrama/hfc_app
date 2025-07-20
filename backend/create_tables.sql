-- Create tables for HerFoodCode app

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    current_strategy VARCHAR(255),
    goals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL, -- 'user' or 'bot'
    text TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tracked symptoms table
CREATE TABLE IF NOT EXISTS tracked_symptoms (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    symptom VARCHAR(255) NOT NULL,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily logs table
CREATE TABLE IF NOT EXISTS daily_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    applied_strategy BOOLEAN NOT NULL,
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    symptom_scores JSONB DEFAULT '{}',
    extra_symptoms TEXT,
    extra_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Trial periods table
CREATE TABLE IF NOT EXISTS trial_periods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracked_symptoms_user_id ON tracked_symptoms(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_id ON daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
CREATE INDEX IF NOT EXISTS idx_trial_periods_user_id ON trial_periods(user_id);
CREATE INDEX IF NOT EXISTS idx_trial_periods_is_active ON trial_periods(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_periods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - users can only access their own data)
-- Note: You may want to customize these policies based on your security requirements

-- Users can only access their own data
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = email);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = email);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid()::text = email);

-- Chat messages policies
CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

-- Tracked symptoms policies
CREATE POLICY "Users can view own symptoms" ON tracked_symptoms FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can insert own symptoms" ON tracked_symptoms FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can update own symptoms" ON tracked_symptoms FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can delete own symptoms" ON tracked_symptoms FOR DELETE USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

-- Daily logs policies
CREATE POLICY "Users can view own logs" ON daily_logs FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can insert own logs" ON daily_logs FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can update own logs" ON daily_logs FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));

-- Trial periods policies
CREATE POLICY "Users can view own trial periods" ON trial_periods FOR SELECT USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can insert own trial periods" ON trial_periods FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text));
CREATE POLICY "Users can update own trial periods" ON trial_periods FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE email = auth.uid()::text)); 