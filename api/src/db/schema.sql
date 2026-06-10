-- DoCoDeGo Survey Builder — D1 Schema
-- Decision: 5 normalized tables. Question config stored as JSON column for flexibility
-- without needing separate tables per question type.

-- Enable foreign key enforcement (D1/SQLite default is off)
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  -- Decision: Use share_token (UUID) instead of survey.id for public URLs
  -- so we can revoke access by regenerating the token without deleting the survey
  share_token TEXT UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(16)))),
  brand_color TEXT NOT NULL DEFAULT '#6366f1',
  brand_logo_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  survey_id TEXT NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('short_text', 'multiple_choice', 'rating')),
  label TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  -- Decision: JSON column for question config — {options:[...]} for MC, {max:5} for rating.
  -- Simpler than separate tables, flexible for future question types.
  -- Trade-off: can't query config fields in SQL, but we never need to.
  config TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS responses (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  survey_id TEXT NOT NULL REFERENCES surveys(id),
  submitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  respondent_meta TEXT  -- optional: JSON with IP or user agent for analytics
);

CREATE TABLE IF NOT EXISTS response_answers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  response_id TEXT NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id),
  value TEXT NOT NULL  -- always stored as string, parsed at read time
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_surveys_owner ON surveys(owner_id);
CREATE INDEX IF NOT EXISTS idx_surveys_share_token ON surveys(share_token);
CREATE INDEX IF NOT EXISTS idx_questions_survey ON questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_responses_survey ON responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_answers_response ON response_answers(response_id);
