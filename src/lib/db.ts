import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const url = import.meta.env.DATABASE_URL ?? 'file:./data/raiz.db';
const authToken = import.meta.env.DATABASE_AUTH_TOKEN;

if (url.startsWith('file:')) {
  const filePath = url.slice('file:'.length);
  const dir = dirname(filePath);
  if (dir && dir !== '.') {
    mkdirSync(dir, { recursive: true });
  }
}

export const db: Client = createClient({ url, authToken });

let initialised = false;

/**
 * Crea las tablas si no existen. Idempotente.
 * Fuente de verdad del esquema: migrations/*.sql (mantener sincronizados).
 */
export async function ensureSchema(): Promise<void> {
  if (initialised) return;
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS auth_tokens (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        expires_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        stripe_session_id TEXT UNIQUE,
        amount_total INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'eur',
        status TEXT NOT NULL DEFAULT 'pending',
        items_json TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        tagline TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        price INTEGER NOT NULL DEFAULT 0,
        weight TEXT NOT NULL DEFAULT '',
        ingredients TEXT NOT NULL DEFAULT '[]',
        tags TEXT NOT NULL DEFAULT '[]',
        emoji TEXT NOT NULL DEFAULT '🌾',
        color TEXT NOT NULL DEFAULT '#C99A3F',
        image_url TEXT NOT NULL DEFAULT '',
        featured INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_active ON products(active)`,
      `CREATE INDEX IF NOT EXISTS idx_tokens_type ON auth_tokens(type)`,
    ],
    'write',
  );

  // Para bases de datos creadas antes de añadir email_verified: añadir la columna.
  try {
    await db.execute('ALTER TABLE users ADD COLUMN email_verified INTEGER NOT NULL DEFAULT 0');
  } catch {
    // la columna ya existe: ignorar
  }

  initialised = true;
}
