import type { APIRoute } from 'astro';
import { emailEnabled, sendVerificationEmail } from '../../../lib/email';
import { createToken } from '../../../lib/tokens';
import { rateLimit } from '../../../lib/ratelimit';

export const prerender = false;

export const POST: APIRoute = async ({ locals, request, redirect, clientAddress }) => {
  const user = locals.user;
  if (!user) return redirect('/login');
  if (user.emailVerified) return redirect('/cuenta');

  const done = redirect('/cuenta?reenviado=1');

  // Anti abuso: 3 reenvíos por usuario cada hora.
  const ip = String(clientAddress || 'unknown');
  const rl = await rateLimit(`resend:${user.id}:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) return done;

  if (emailEnabled) {
    const token = await createToken(user.id, 'verify', 24);
    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendVerificationEmail(user.email, `${site}/verificar?token=${token}`);
  }

  return done;
};
