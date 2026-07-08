import type { APIRoute } from 'astro';
import { createUser, createSession, findUserByEmail } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  // sanitize: elimina caracteres de control / CRLF (lección 1.2 del playbook)
  const clean = (v: unknown) => String(v ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();

  const data = await request.formData();

  // Honeypot: si el bot rellenó el campo oculto, fingimos éxito y no creamos nada.
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

  const user = await createUser(name, email, password);
  await createSession(user.id, cookies);
  return redirect('/cuenta');
};
