import type { APIRoute } from 'astro';
import { getStripe } from '../../lib/stripe';
import { markOrderPaid } from '../../lib/orders';

export const prerender = false;

// Webhook de Stripe. Configúralo en el dashboard apuntando a /api/webhook
// y añade STRIPE_WEBHOOK_SECRET a tu .env.
export const POST: APIRoute = async ({ request }) => {
  const secret = import.meta.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || secret.includes('xxxx') || !signature) {
    return new Response('Webhook no configurado', { status: 400 });
  }

  const payload = await request.text();
  const stripe = getStripe();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch (err) {
    console.error('[webhook] firma inválida', err);
    return new Response('Firma inválida', { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { id: string; customer_details?: { email?: string } };
    await markOrderPaid(session.id, session.customer_details?.email ?? null);
  }

  return new Response('ok', { status: 200 });
};
