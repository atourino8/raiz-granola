import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { getProductBySlug } from '../../lib/catalog';
import { db, ensureSchema } from '../../lib/db';

export const prerender = false;

interface IncomingItem {
  slug: string;
  qty: number;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const items: IncomingItem[] = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return json({ error: 'La cesta está vacía' }, 400);
    }

    // Recalculamos precios en el servidor desde la DB (nunca confíes en el cliente).
    const lineItems = [];
    let amountTotal = 0;
    const summary: Array<{ slug: string; qty: number }> = [];

    for (const it of items) {
      const product = await getProductBySlug(it.slug);
      const qty = Math.max(1, Math.min(50, Number(it.qty) || 1));
      if (!product) continue;
      amountTotal += product.price * qty;
      summary.push({ slug: product.slug, qty });
      lineItems.push({
        quantity: qty,
        price_data: {
          currency: 'eur',
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.tagline,
          },
        },
      });
    }

    if (lineItems.length === 0) {
      return json({ error: 'No hay productos válidos en la cesta' }, 400);
    }

    const site = import.meta.env.PUBLIC_SITE_URL || new URL(request.url).origin;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: locals.user?.email,
      shipping_address_collection: { allowed_countries: ['ES', 'PT', 'FR', 'DE', 'IT'] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 395, currency: 'eur' },
            display_name: 'Envío estándar (24-48 h)',
            delivery_estimate: {
              minimum: { unit: 'business_day', value: 1 },
              maximum: { unit: 'business_day', value: 2 },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Envío gratis (pedidos +35 €)',
          },
        },
      ],
      success_url: `${site}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/carrito`,
    });

    await ensureSchema();
    await db.execute({
      sql: `INSERT INTO orders (user_id, stripe_session_id, amount_total, status, items_json)
            VALUES (?, ?, ?, 'pending', ?)`,
      args: [locals.user?.id ?? null, session.id, amountTotal, JSON.stringify(summary)],
    });

    return json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    const message = err instanceof Error ? err.message : 'Error al crear el pago';
    return json({ error: message }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
