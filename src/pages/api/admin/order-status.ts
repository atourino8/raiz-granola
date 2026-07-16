import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin';
import { db, ensureSchema } from '../../../lib/db';

export const prerender = false;

const ALLOWED = ['pending', 'paid', 'fulfilled', 'cancelled'];

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!isAdmin(locals.user)) return new Response('No autorizado', { status: 403 });

  const data = await request.formData();
  const id = Number(data.get('id'));
  const status = String(data.get('status') ?? '');
  if (!id || !ALLOWED.includes(status)) return redirect('/admin/pedidos');

  await ensureSchema();
  await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, id] });
  return redirect('/admin/pedidos?saved=1');
};
