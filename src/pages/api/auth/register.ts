import type { APIRoute } from 'astro';
import { createUser, createSession, findUserByEmail } from '../../../lib/auth';
import { isVerifiedAdmin } from '../../../lib/admin';
import { emailEnabled, sendVerificationEmail } from '../../../lib/email';
import { createToken } from '../../../lib/tokens';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const clean = (v: unknown) => String(v ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();
  const data = await request.formData();

  // Honeypot anti-bot
  if (String(data.get('website') ?? '').trim() !== '') {
    return redirect('/cuenta');
  }

  const name = clean(data.get('name'));
  const email = clean(data.get('email'));
  const password = String(data.get('password') ?? '');

  const back = (msg: string) =>
    redirect(`/registro?error=${encodeURIComponent(msg)}&email=${encodeURIComponent(email)}`);

  if (name.length < 2) return back('Escribe tu nombre.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return back('Email no válido.');
  if (password.length < 8) return back('La contraseña debe tener al menos 8 caracteres.');

  if (await findUserByEmail(email)) {
    return back('Ya existe una cuenta con ese email.');
  }

  // Si Resend está configurado, la cuenta nace SIN verificar (hay que confirmar
  // el email). Si no lo está (dev), se auto-verifica para no bloquear el flujo.
  const verified = !emailEnabled;

  let user;
  try {
    user = await createUser(name, email, password, verified);
  } catch {
    return back('No se pudo crear la cuenta. Puede que el email ya esté registrado.');
  }

  if (emailEnabled) {
    const token = await createToken(user.id, 'verify', 24);
    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendVerificationEmail(email, `${site}/verificar?token=${token}`);
  }

  await createSession(user.id, cookies);
  return redirect(isVerifiedAdmin(user) ? '/admin' : '/cuenta?bienvenida=1');
};
