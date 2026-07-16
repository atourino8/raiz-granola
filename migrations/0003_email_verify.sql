-- Migración 0003 · verificación de email y tokens de un solo uso
-- (aplicado desde código en src/lib/db.ts::ensureSchema; versionado aquí)

ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS auth_tokens (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tokens_type ON auth_tokens(type);
