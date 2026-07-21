import { persistentMap } from '@nanostores/persistent';
import { computed } from 'nanostores';

export interface CartItem {
  slug: string;
  name: string;
  price: number; // céntimos
  emoji: string;
  image?: string;
  qty: number;
}

// Carrito persistente en localStorage.
// persistentMap guarda cada valor (un CartItem) serializado con encode/decode.
export const cart = persistentMap<Record<string, CartItem>>(
  'raiz_cart:',
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  },
);

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const current = cart.get()[item.slug];
  const nextQty = (current?.qty ?? 0) + qty;
  cart.setKey(item.slug, { ...item, qty: nextQty });
}

export function setQty(slug: string, qty: number) {
  const current = cart.get()[slug];
  if (!current) return;
  if (qty <= 0) {
    removeFromCart(slug);
  } else {
    cart.setKey(slug, { ...current, qty });
  }
}

export function removeFromCart(slug: string) {
  // setKey(undefined) elimina la clave y su entrada en localStorage.
  cart.setKey(slug, undefined as unknown as CartItem);
}

export function clearCart() {
  for (const slug of Object.keys(cart.get())) {
    cart.setKey(slug, undefined as unknown as CartItem);
  }
}

export const cartCount = computed(cart, (value) =>
  Object.values(value).reduce((n, item) => n + (item?.qty ?? 0), 0),
);

export const cartTotal = computed(cart, (value) =>
  Object.values(value).reduce((sum, item) => sum + (item?.price ?? 0) * (item?.qty ?? 0), 0),
);

export function cartItems(): CartItem[] {
  return Object.values(cart.get()).filter(Boolean);
}
