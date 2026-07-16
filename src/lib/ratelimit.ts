import { db, ensureSchema } from './db';

// Limitador simple respaldado por la base de datos (sirve en serverless).
// Guarda intentos con marca de tiempo (epoch ms) y cuenta los recientes.

export interface RateResult {
  allowed: boolean;
  remaining: number;
}

export async function rateLimit(key: string, max: number, windowMs: number): Promise<RateResult> {
  await ensureSchema();
  const now = Date.now();
  const since = now - windowMs;

  // Limpieza oportunista de registros viejos (más de 1 hora).
  await db.execute({ sql: 'DELETE FROM rate_limits WHERE ts < ?', args: [now - 3600_000] });

  const res = await db.execute({
    sql: 'SELECT COUNT(*) AS n FROM rate_limits WHERE key = ? AND ts > ?',
    args: [key, since],
  });
  const n = Number(res.rows[0].n);
  if (n >= max) {
    return { allowed: false, remaining: 0 };
  }
  await db.execute({ sql: 'INSERT INTO rate_limits (key, ts) VALUES (?, ?)', args: [key, now] });
  return { allowed: true, remaining: max - n - 1 };
}

// Limpia el contador de una clave (p. ej. tras un login correcto).
export async function clearRateLimit(key: string): Promise<void> {
  await ensureSchema();
  await db.execute({ sql: 'DELETE FROM rate_limits WHERE key = ?', args: [key] });
}
