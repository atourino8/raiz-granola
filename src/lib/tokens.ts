import { randomBytes } from 'node:crypto';
import { db, ensureSchema } from './db';

export type TokenType = 'verify' | 'reset';

// Crea un token de un solo uso con caducidad (por defecto 24 h).
export async function createToken(userId: number, type: TokenType, hours = 24): Promise<string> {
  await ensureSchema();
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000);
  await db.execute({
    sql: 'INSERT INTO auth_tokens (token, user_id, type, expires_at) VALUES (?, ?, ?, ?)',
    args: [token, userId, type, expires.toISOString()],
  });
  return token;
}

// Valida y consume el token (lo borra). Devuelve el userId o null si no vale.
export async function consumeToken(token: string, type: TokenType): Promise<number | null> {
  if (!token) return null;
  await ensureSchema();
  const res = await db.execute({
    sql: 'SELECT user_id, expires_at FROM auth_tokens WHERE token = ? AND type = ?',
    args: [token, type],
  });
  const row = res.rows[0];
  if (!row) return null;
  await db.execute({ sql: 'DELETE FROM auth_tokens WHERE token = ?', args: [token] });
  if (new Date(String(row.expires_at)) < new Date()) return null;
  return Number(row.user_id);
}
