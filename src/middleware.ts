import { defineMiddleware } from 'astro:middleware';
import { getUserFromSession } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  try {
    context.locals.user = await getUserFromSession(context.cookies);
  } catch {
    context.locals.user = null;
  }

  const response = await next();

  // Cabeceras de seguridad (lección 1.2 del playbook: securityheaders.com)
  const h = response.headers;
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'SAMEORIGIN');
  h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  if (import.meta.env.PROD) {
    h.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  return response;
});
