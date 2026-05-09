-- ============================================================
--  TaskFlow — Initial Schema
--  Run once against your RDS or local Postgres instance
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT                NOT NULL,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Projects ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  color       VARCHAR(20)   DEFAULT '#7c6ff7',
  owner_id    INT           REFERENCES users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ   DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Project Members (many-to-many) ─────────────────────────
CREATE TABLE IF NOT EXISTS project_members (
  project_id  INT REFERENCES projects(id) ON DELETE CASCADE,
  user_id     INT REFERENCES users(id)    ON DELETE CASCADE,
  role        VARCHAR(20) DEFAULT 'member',  -- 'owner' | 'member'
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

-- ── Tasks ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id            SERIAL PRIMARY KEY,
  project_id    INT           NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assignee_id   INT           REFERENCES users(id) ON DELETE SET NULL,
  title         VARCHAR(255)  NOT NULL,
  description   TEXT,
  status        VARCHAR(20)   NOT NULL DEFAULT 'todo'
                  CHECK (status IN ('backlog','todo','inprogress','review','done')),
  priority      VARCHAR(10)   NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('high','medium','low')),
  tag           VARCHAR(50)   DEFAULT 'Other',
  progress      SMALLINT      DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  sort_order    INT           DEFAULT 0,
  due_date      DATE,
  created_by    INT           REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_project    ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee   ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_sort       ON tasks(project_id, status, sort_order);

-- ── Auto-update updated_at ─────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER trg_projects_updated
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE OR REPLACE TRIGGER trg_tasks_updated
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Seed: demo user + project ──────────────────────────────
-- Password is "password123" (bcrypt, 10 rounds)
INSERT INTO users (name, email, password_hash) VALUES
  ('Dev User', 'dev@taskflow.io', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.')
ON CONFLICT (email) DO NOTHING;

INSERT INTO projects (name, description, color, owner_id, due_date)
SELECT 'Dev Sprint #4', 'Main development sprint', '#7c6ff7', id, '2025-07-28'
FROM users WHERE email = 'dev@taskflow.io'
ON CONFLICT DO NOTHING;

INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, u.id, 'owner'
FROM projects p, users u
WHERE p.name = 'Dev Sprint #4' AND u.email = 'dev@taskflow.io'
ON CONFLICT DO NOTHING;
