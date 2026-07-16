import type { APIRoute } from 'astro';
import { emailEnabled, sendVerificationEmail } from '../../../lib/email';
import { createToken } from '../../../lib/tokens';

export const prerender = false;

export const POST: APIRoute = async ({ locals, request, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/login');
  if (user.emailVerified) return redirect('/cuenta');

  if (emailEnabled) {
    const token = await createToken(user.id, 'verify', 24);
    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    await sendVerificationEmail(user.email, `${site}/verificar?token=${token}`);
  }

  return redirect('/cuenta?reenviado=1');
};
