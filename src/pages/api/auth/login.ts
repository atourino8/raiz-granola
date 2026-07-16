import type { APIRoute } from 'astro';
import { findUserByEmail, verifyPassword, createSession, burnPasswordTime } from '../../../lib/auth';
import { isVerifiedAdmin } from '../../../lib/admin';
import { rateLimit, clearRateLimit } from '../../../lib/ratelimit';

export const prerender = false;

function safeNext(v: unknown): string | null {
  const s = String(v ?? '');
  return s.startsWith('/') && !s.startsWith('//') ? s : null;
}

function clientIp(v: unknown): string {
  try {
    return String(v || 'unknown');
  } catch {
    return 'unknown';
  }
}

export const POST: APIRoute = async ({ request, cookies, redirect, clientAddress }) => {
  const data = await request.formData();

  if (String(data.get('website') ?? '').trim() !== '') {
    return redirect('/login?error=' + encodeURIComponent('Email o contraseña incorrectos.'));
  }

  const email = String(data.get('email') ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();
  const password = String(data.get('password') ?? '');
  const next = safeNext(data.get('next'));
  const ip = clientIp(clientAddress);

  const withNext = (base: string) => base + (next ? `&next=${encodeURIComponent(next)}` : '');

  // Anti fuerza-bruta: 5 intentos por IP+email cada 15 minutos.
  const key = `login:${ip}:${email}`;
  const rl = await rateLimit(key, 5, 15 * 60 * 1000);
  if (!rl.allowed) {
    return redirect(
      withNext('/login?error=' + encodeURIComponent('Demasiados intentos. Espera unos minutos.')),
    );
  }

  const fail = () =>
    redirect(
      withNext(
        `/login?error=${encodeURIComponent('Email o contraseña incorrectos.')}&email=${encodeURIComponent(email)}`,
      ),
    );

  const row = await findUserByEmail(email);
  if (!row) {
    burnPasswordTime(password); // gasta el mismo tiempo aunque no exista el usuario
    return fail();
  }
  if (!verifyPassword(password, String(row.password_hash))) return fail();

  await clearRateLimit(key);
  await createSession(Number(row.id), cookies);

  const user = { email: String(row.email), emailVerified: Number(row.email_verified) === 1 };
  const dest = next ?? (isVerifiedAdmin(user) ? '/admin' : '/cuenta');
  return redirect(dest);
};
