import type { APIRoute } from 'astro';
import { db, ensureSchema } from '../../../lib/db';
import { destroySession } from '../../../lib/auth';

export const prerender = false;

// Elimina la cuenta del usuario (derecho de supresión, RGPD).
// Los pedidos quedan anonimizados (user_id -> NULL por ON DELETE SET NULL);
// sesiones y tokens se borran en cascada.
export const POST: APIRoute = async ({ locals, cookies, redirect }) => {
  const user = locals.user;
  if (!user) return redirect('/login');

  await ensureSchema();
  await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [user.id] });
  await destroySession(cookies);

  return redirect('/?cuenta=eliminada');
};
