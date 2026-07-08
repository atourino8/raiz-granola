import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// Cliente libSQL. En desarrollo usa un archivo local (file:./data/raiz.db).
// En producción puedes apuntar DATABASE_URL a Turso (libsql://...).
const url = import.meta.env.DATABASE_URL ?? 'file:./data/raiz.db';
const authToken = import.meta.env.DATABASE_AUTH_TOKEN;

// libSQL crea el archivo .db pero NO la carpeta que lo contiene.
// Aseguramos que exista el directorio para el modo fichero local.
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
 * Fuente de verdad del esquema: migrations/0001_init.sql (mantener sincronizados).
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
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
    ],
    'write',
  );
  initialised = true;
}
