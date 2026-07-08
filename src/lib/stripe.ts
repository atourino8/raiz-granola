import Stripe from 'stripe';

const key = import.meta.env.STRIPE_SECRET_KEY;

// Cliente Stripe perezoso: sólo falla si realmente se usa sin clave.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!key || key.includes('xxxx')) {
    throw new Error(
      'STRIPE_SECRET_KEY no está configurada. Copia .env.example a .env y añade tus claves de Stripe.',
    );
  }
  if (!_stripe) {
    // Sin apiVersion fija: usa la versión por defecto de tu cuenta Stripe.
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export const stripeConfigured = Boolean(key && !key.includes('xxxx'));
