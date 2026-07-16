import type { APIRoute } from 'astro';
import { findUserByEmail } from '../../../lib/auth';
import { emailEnabled, sendPasswordResetEmail } from '../../../lib/email';
import { createToken } from '../../../lib/tokens';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const email = String(data.get('email') ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();

  // Respuesta idéntica exista o no la cuenta (no filtrar qué emails hay).
  const row = await findUserByEmail(email);
  if (row && emailEnabled) {
    const token = await createToken(Number(row.id), 'reset', 2);
    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendPasswordResetEmail(email, `${site}/restablecer?token=${token}`);
  }

  return redirect('/recuperar?sent=1');
};
