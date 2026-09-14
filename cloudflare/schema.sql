-- Cloudflare D1 Database Schema for Triem Krobkhand (ត្រៀមក្របខ័ណ្ឌ)
-- Execute with: npx wrangler d1 execute triem-krobkhand-db --file=./schema.sql

-- 1. Exams Table (តារាងវិញ្ញាសា)
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    ministry_id TEXT NOT NULL,
    ministry_name TEXT NOT NULL,
    category_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    year TEXT DEFAULT '2024',
    duration_minutes INTEGER DEFAULT 60,
    difficulty TEXT DEFAULT 'មធ្យម',
    total_questions INTEGER DEFAULT 30,
    description TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    tags TEXT, -- Comma-separated or JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Mock Test Questions Table (តារាងសំណួរតេស្តសាកល្បង)
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    ministry_id TEXT DEFAULT 'all',
    question TEXT NOT NULL,
    image_url TEXT, -- Diagram / chart image URL or base64
    options TEXT NOT NULL, -- JSON Array: ["Option A", "Option B", "Option C", "Option D"]
    correct_answer INTEGER NOT NULL, -- 0 for A, 1 for B, 2 for C, 3 for D
    explanation TEXT, -- Detailed explanation in Khmer
    difficulty TEXT DEFAULT 'មធ្យម',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Quiz Results History (ប្រវត្តិលទ្ធផលតេស្ត)
CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    candidate_name TEXT,
    category_id TEXT,
    ministry_id TEXT,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    percentage REAL NOT NULL,
    time_spent_seconds INTEGER,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. App Metadata & Configurations (ការកំណត់ និង Version)
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Users Table (តារាងអ្នកប្រើប្រាស់/បេក្ខជន)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    provider TEXT DEFAULT 'google', -- 'google' or 'email'
    target_ministry TEXT DEFAULT 'សាលាភូមិន្ទរដ្ឋបាល (ERA)',
    role TEXT DEFAULT 'candidate', -- 'candidate' or 'admin'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exams_ministry ON exams(ministry_id);
CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_ministry ON questions(ministry_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. Example: Insert or Update Admin Account securely in Database (Zero passwords in frontend code)
-- INSERT INTO system_config (key, value)
-- VALUES ('admin_account', '{"name":"Admin","email":"admin@example.com","password":"your_secure_password"}')
-- ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

