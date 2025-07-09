-- Telegram Analytics Database Schema

-- Daily member joins for chart data
CREATE TABLE IF NOT EXISTS daily_member_joins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    sh_news INTEGER DEFAULT 0,
    sh_community INTEGER DEFAULT 0,
    sh_crypto_lesson INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date)
);

-- Active members by message count
CREATE TABLE IF NOT EXISTS active_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    username TEXT,
    messages INTEGER DEFAULT 0,
    group_name TEXT NOT NULL,
    last_message_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(telegram_id, group_name)
);

-- Group information and member counts
CREATE TABLE IF NOT EXISTS group_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL UNIQUE,
    group_name TEXT NOT NULL,
    title TEXT,
    member_count INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Message tracking for analytics
CREATE TABLE IF NOT EXISTS message_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER NOT NULL,
    group_id TEXT NOT NULL,
    message_id INTEGER NOT NULL,
    user_name TEXT,
    username TEXT,
    message_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_joins_date ON daily_member_joins(date);
CREATE INDEX IF NOT EXISTS idx_active_members_messages ON active_members(messages DESC);
CREATE INDEX IF NOT EXISTS idx_active_members_group ON active_members(group_name);
CREATE INDEX IF NOT EXISTS idx_message_logs_date ON message_logs(message_date);
CREATE INDEX IF NOT EXISTS idx_message_logs_group ON message_logs(group_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(telegram_id);