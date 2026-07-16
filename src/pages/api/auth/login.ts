import type { APIRoute } from 'astro';
import { findUserByEmail, verifyPassword, createSession } from '../../../lib/auth';
import { isVerifiedAdmin } from '../../../lib/admin';

export const prerender = false;

function safeNext(v: unknown): string | null {
  const s = String(v ?? '');
  return s.startsWith('/') && !s.startsWith('//') ? s : null;
}

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();

  if (String(data.get('website') ?? '').trim() !== '') {
    return redirect('/login?error=' + encodeURIComponent('Email o contraseña incorrectos.'));
  }

  const email = String(data.get('email') ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();
  const password = String(data.get('password') ?? '');
  const next = safeNext(data.get('next'));

  const fail = () =>
    redirect(
      `/login?error=${encodeURIComponent('Email o contraseña incorrectos.')}` +
        `&email=${encodeURIComponent(email)}` +
        (next ? `&next=${encodeURIComponent(next)}` : ''),
    );

  const row = await findUserByEmail(email);
  if (!row) return fail();
  if (!verifyPassword(password, String(row.password_hash))) return fail();

  await createSession(Number(row.id), cookies);

  const user = { email: String(row.email), emailVerified: Number(row.email_verified) === 1 };
  const dest = next ?? (isVerifiedAdmin(user) ? '/admin' : '/cuenta');
  return redirect(dest);
};
