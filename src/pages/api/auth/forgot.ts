import type { APIRoute } from 'astro';
import { findUserByEmail } from '../../../lib/auth';
import { emailEnabled, sendPasswordResetEmail } from '../../../lib/email';
import { createToken } from '../../../lib/tokens';
import { rateLimit } from '../../../lib/ratelimit';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect, clientAddress }) => {
  const data = await request.formData();
  const email = String(data.get('email') ?? '').replace(/[\x00-\x1F\x7F]+/g, '').trim();

  // Respuesta idéntica exista o no la cuenta (no filtrar qué emails hay).
  const done = redirect('/recuperar?sent=1');

  // Anti abuso / email-bombing: 3 solicitudes por IP+email cada hora.
  const ip = String(clientAddress || 'unknown');
  const rl = await rateLimit(`forgot:${ip}:${email}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return done;

  const row = await findUserByEmail(email);
  if (row && emailEnabled) {
    const token = await createToken(Number(row.id), 'reset', 2);
    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendPasswordResetEmail(email, `${site}/restablecer?token=${token}`);
  }

  return done;
};
