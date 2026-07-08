import type { APIRoute } from 'astro';
import { findUserByEmail, verifyPassword, createSession } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const data = await request.formData();

  // Honeypot anti-bot
  if (String(data.get('website') ?? '').trim() !== '') {
    return redirect('/login?error=' + encodeURIComponent('Email o contraseña incorrectos.'));
  }

  // sanitize: elimina caracteres de control / CRLF (lección 1.2 del playbook)
  const email = String(data.get('email') ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();
  const password = String(data.get('password') ?? '');

  const back = () =>
    redirect(`/login?error=${encodeURIComponent('Email o contraseña incorrectos.')}&email=${encodeURIComponent(email)}`);

  const row = await findUserByEmail(email);
  if (!row) return back();

  if (!verifyPassword(password, String(row.password_hash))) return back();

  await createSession(Number(row.id), cookies);
  return redirect('/cuenta');
};
