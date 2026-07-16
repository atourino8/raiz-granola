-- Migración 0004 · hardening
-- (aplicado desde código en src/lib/db.ts::ensureSchema; versionado aquí)

CREATE TABLE IF NOT EXISTS rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_key ON rate_limits(key, ts);
