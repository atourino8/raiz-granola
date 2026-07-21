import type { APIRoute } from 'astro';
import { isVerifiedAdmin } from '../../../lib/admin';
import { db, ensureSchema } from '../../../lib/db';
import { sendOrderShippedEmail } from '../../../lib/email';

export const prerender = false;

const ALLOWED = ['pending', 'paid', 'fulfilled', 'cancelled'];

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!isVerifiedAdmin(locals.user)) return new Response('No autorizado', { status: 403 });

  const data = await request.formData();
  const id = Number(data.get('id'));
  const status = String(data.get('status') ?? '');
  if (!id || !ALLOWED.includes(status)) return redirect('/admin/pedidos');

  await ensureSchema();
  await db.execute({ sql: 'UPDATE orders SET status = ? WHERE id = ?', args: [status, id] });

  // Al marcar "enviado", avisamos al cliente por email (si hay email y Resend configurado).
  if (status === 'fulfilled') {
    const res = await db.execute({
      sql: `SELECT o.customer_email AS oe, u.email AS ue FROM orders o
            LEFT JOIN users u ON u.id = o.user_id WHERE o.id = ?`,
      args: [id],
    });
    const row = res.rows[0];
    const to = row ? String(row.oe ?? row.ue ?? '') : '';
    if (to) {
      const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
      await sendOrderShippedEmail(to, id, site);
    }
  }

  return redirect('/admin/pedidos?saved=1');
};
