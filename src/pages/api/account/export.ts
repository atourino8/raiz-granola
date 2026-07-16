import type { APIRoute } from 'astro';
import { db, ensureSchema } from '../../../lib/db';

export const prerender = false;

// Exporta los datos personales del usuario (derecho de portabilidad, RGPD).
export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return new Response('No autorizado', { status: 401 });

  await ensureSchema();
  const orders = await db.execute({
    sql: `SELECT id, amount_total, currency, status, items_json, created_at
          FROM orders WHERE user_id = ? ORDER BY created_at DESC`,
    args: [user.id],
  });

  const data = {
    exportadoEl: new Date().toISOString(),
    usuario: {
      id: user.id,
      nombre: user.name,
      email: user.email,
      emailVerificado: user.emailVerified,
    },
    pedidos: orders.rows.map((r) => ({
      id: Number(r.id),
      importe: Number(r.amount_total),
      moneda: String(r.currency),
      estado: String(r.status),
      articulos: JSON.parse(String(r.items_json)),
      fecha: String(r.created_at),
    })),
  };

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mis-datos-raiz.json"',
    },
  });
};
