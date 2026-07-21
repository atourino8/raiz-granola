import { db, ensureSchema } from './db';
import { decrementStock } from './catalog';

// Marca un pedido como pagado UNA sola vez (idempotente entre /checkout/exito y el webhook).
// Si realmente cambia el estado, descuenta el stock. Devuelve true si hubo cambio.
export async function markOrderPaid(sessionId: string, customerEmail?: string | null): Promise<boolean> {
  await ensureSchema();
  const sql = customerEmail
    ? `UPDATE orders SET status = 'paid', customer_email = COALESCE(customer_email, ?) WHERE stripe_session_id = ? AND status != 'paid'`
    : `UPDATE orders SET status = 'paid' WHERE stripe_session_id = ? AND status != 'paid'`;
  const args = customerEmail ? [customerEmail, sessionId] : [sessionId];
  const res = await db.execute({ sql, args });
  const changed = Number(res.rowsAffected ?? 0) > 0;
  if (changed) {
    const o = await db.execute({
      sql: 'SELECT items_json FROM orders WHERE stripe_session_id = ?',
      args: [sessionId],
    });
    if (o.rows[0]) {
      try {
        const items = JSON.parse(String(o.rows[0].items_json)) as Array<{ slug: string; qty: number }>;
        await decrementStock(items);
      } catch {
        /* items_json corrupto: ignorar */
      }
    }
  }
  return changed;
}
