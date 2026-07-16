import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { AstroCookies } from 'astro';
import { db, ensureSchema } from './db';

// En producción usamos el prefijo __Host- (exige Secure + Path=/ + sin Domain),
// que impide sobrescribir la cookie desde subdominios. En dev (http) no aplica.
const SESSION_COOKIE = import.meta.env.PROD ? '__Host-raiz_session' : 'raiz_session';
// Duración de sesión configurable (por defecto 7 días). Evita "sesión infinita".
const SESSION_DAYS = Number(import.meta.env.SESSION_DAYS ?? '7') || 7;

export interface User {
  id: number;
  name: string;
  email: string;
  emailVerified: boolean;
}

// ─── Hash de contraseñas con scrypt (nativo de Node, sin dependencias) ───

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64);
  const original = Buffer.from(hash, 'hex');
  return original.length === derived.length && timingSafeEqual(original, derived);
}

// Hash "señuelo" para gastar el mismo tiempo cuando el usuario no existe
// (mitiga ataques de timing que revelarían qué emails están registrados).
const DUMMY_HASH = hashPassword('raiz-dummy-password-para-timing');
export function burnPasswordTime(password: string): void {
  try {
    verifyPassword(password, DUMMY_HASH);
  } catch {
    /* no-op */
  }
}

// ─── Usuarios ───

export async function createUser(
  name: string,
  email: string,
  password: string,
  verified = false,
): Promise<User> {
  await ensureSchema();
  const password_hash = hashPassword(password);
  const res = await db.execute({
    sql: `INSERT INTO users (name, email, password_hash, email_verified)
          VALUES (?, ?, ?, ?)
          RETURNING id, name, email, email_verified`,
    args: [name, email.toLowerCase().trim(), password_hash, verified ? 1 : 0],
  });
  const row = res.rows[0];
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    emailVerified: Number(row.email_verified) === 1,
  };
}

export async function findUserByEmail(email: string) {
  await ensureSchema();
  const res = await db.execute({
    sql: 'SELECT id, name, email, password_hash, email_verified FROM users WHERE email = ?',
    args: [email.toLowerCase().trim()],
  });
  return res.rows[0] ?? null;
}

export async function setEmailVerified(userId: number): Promise<void> {
  await ensureSchema();
  await db.execute({ sql: 'UPDATE users SET email_verified = 1 WHERE id = ?', args: [userId] });
}

export async function updatePassword(userId: number, password: string): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
    args: [hashPassword(password), userId],
  });
  // Al cambiar la contraseña, invalidamos TODAS las sesiones del usuario
  // (mata cualquier sesión robada o antigua).
  await db.execute({ sql: 'DELETE FROM sessions WHERE user_id = ?', args: [userId] });
}

export async function deleteAllSessions(userId: number): Promise<void> {
  await ensureSchema();
  await db.execute({ sql: 'DELETE FROM sessions WHERE user_id = ?', args: [userId] });
}

// ─── Sesiones ───

export async function createSession(userId: number, cookies: AstroCookies): Promise<void> {
  await ensureSchema();
  const id = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await db.execute({
    sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    args: [id, userId, expires.toISOString()],
  });
  cookies.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    path: '/',
    expires,
  });
}

export async function getUserFromSession(cookies: AstroCookies): Promise<User | null> {
  const id = cookies.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  await ensureSchema();
  const res = await db.execute({
    sql: `SELECT u.id, u.name, u.email, u.email_verified, s.expires_at
          FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.id = ?`,
    args: [id],
  });
  const row = res.rows[0];
  if (!row) return null;
  if (new Date(String(row.expires_at)) < new Date()) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [id] });
    return null;
  }
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    emailVerified: Number(row.email_verified) === 1,
  };
}

export async function destroySession(cookies: AstroCookies): Promise<void> {
  const id = cookies.get(SESSION_COOKIE)?.value;
  if (id) {
    await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [id] });
  }
  cookies.delete(SESSION_COOKIE, { path: '/' });
}
