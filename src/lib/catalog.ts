import { db, ensureSchema } from './db';
import { seedProducts, type Product } from './products';

// Acceso a productos en la base de datos (solo servidor).

let seeded = false;

async function ensureSeed(): Promise<void> {
  await ensureSchema();
  if (seeded) return;
  const res = await db.execute('SELECT COUNT(*) AS n FROM products');
  if (Number(res.rows[0].n) === 0) {
    for (const p of seedProducts) {
      await db.execute({
        sql: `INSERT INTO products
          (slug, name, tagline, description, price, weight, ingredients, tags, emoji, color, image_url, featured, active, sort_order, stock)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.slug, p.name, p.tagline, p.description, p.price, p.weight,
          JSON.stringify(p.ingredients), JSON.stringify(p.tags),
          p.emoji, p.color, p.imageUrl, p.featured ? 1 : 0, p.active ? 1 : 0, p.sortOrder, p.stock,
        ],
      });
    }
  }
  seeded = true;
}

type Row = Record<string, unknown>;

function toProduct(row: Row): Product {
  const parseArr = (v: unknown): string[] => {
    try {
      const parsed = JSON.parse(String(v ?? '[]'));
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  };
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    tagline: String(row.tagline ?? ''),
    description: String(row.description ?? ''),
    price: Number(row.price),
    weight: String(row.weight ?? ''),
    ingredients: parseArr(row.ingredients),
    tags: parseArr(row.tags),
    emoji: String(row.emoji ?? '🌾'),
    color: String(row.color ?? '#C99A3F'),
    imageUrl: String(row.image_url ?? ''),
    featured: Number(row.featured) === 1,
    active: Number(row.active) === 1,
    sortOrder: Number(row.sort_order ?? 0),
    stock: row.stock === null || row.stock === undefined ? -1 : Number(row.stock),
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  await ensureSeed();
  const res = await db.execute('SELECT * FROM products WHERE active = 1 ORDER BY sort_order, id');
  return res.rows.map((r) => toProduct(r as Row));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  await ensureSeed();
  const res = await db.execute(
    'SELECT * FROM products WHERE active = 1 AND featured = 1 ORDER BY sort_order, id',
  );
  return res.rows.map((r) => toProduct(r as Row));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  await ensureSeed();
  const res = await db.execute({
    sql: 'SELECT * FROM products WHERE slug = ? AND active = 1',
    args: [slug],
  });
  return res.rows[0] ? toProduct(res.rows[0] as Row) : undefined;
}

export async function getAllProductsAdmin(): Promise<Product[]> {
  await ensureSeed();
  const res = await db.execute('SELECT * FROM products ORDER BY sort_order, id');
  return res.rows.map((r) => toProduct(r as Row));
}

export async function getAnyProductBySlug(slug: string): Promise<Product | undefined> {
  await ensureSeed();
  const res = await db.execute({ sql: 'SELECT * FROM products WHERE slug = ?', args: [slug] });
  return res.rows[0] ? toProduct(res.rows[0] as Row) : undefined;
}

export interface ProductInput {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  weight: string;
  ingredients: string[];
  tags: string[];
  emoji: string;
  color: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  sortOrder: number;
  stock: number;
}

export async function upsertProduct(p: ProductInput): Promise<void> {
  await ensureSeed();
  await db.execute({
    sql: `INSERT INTO products
      (slug, name, tagline, description, price, weight, ingredients, tags, emoji, color, image_url, featured, active, sort_order, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        tagline = excluded.tagline,
        description = excluded.description,
        price = excluded.price,
        weight = excluded.weight,
        ingredients = excluded.ingredients,
        tags = excluded.tags,
        emoji = excluded.emoji,
        color = excluded.color,
        image_url = excluded.image_url,
        featured = excluded.featured,
        active = excluded.active,
        sort_order = excluded.sort_order,
        stock = excluded.stock`,
    args: [
      p.slug, p.name, p.tagline, p.description, p.price, p.weight,
      JSON.stringify(p.ingredients), JSON.stringify(p.tags),
      p.emoji, p.color, p.imageUrl, p.featured ? 1 : 0, p.active ? 1 : 0, p.sortOrder, p.stock,
    ],
  });
}

export async function deleteProductBySlug(slug: string): Promise<void> {
  await ensureSeed();
  await db.execute({ sql: 'DELETE FROM products WHERE slug = ?', args: [slug] });
}

// Activa o desactiva un producto.
export async function setProductActive(slug: string, active: boolean): Promise<void> {
  await ensureSeed();
  await db.execute({ sql: 'UPDATE products SET active = ? WHERE slug = ?', args: [active ? 1 : 0, slug] });
}

// Mueve un producto arriba/abajo intercambiando su sort_order con el vecino.
export async function moveProduct(slug: string, dir: 'up' | 'down'): Promise<void> {
  await ensureSeed();
  const all = await getAllProductsAdmin();
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) return;
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;
  const a = all[idx];
  const b = all[swapIdx];
  // Intercambia sort_order (usa el índice como fallback si empatan).
  const aOrder = a.sortOrder === b.sortOrder ? idx : a.sortOrder;
  const bOrder = a.sortOrder === b.sortOrder ? swapIdx : b.sortOrder;
  await db.execute({ sql: 'UPDATE products SET sort_order = ? WHERE slug = ?', args: [bOrder, a.slug] });
  await db.execute({ sql: 'UPDATE products SET sort_order = ? WHERE slug = ?', args: [aOrder, b.slug] });
}

// Descuenta stock tras un pago. Los productos con stock -1 (ilimitado) no se tocan.
export async function decrementStock(items: Array<{ slug: string; qty: number }>): Promise<void> {
  await ensureSeed();
  for (const it of items) {
    const qty = Math.max(1, Number(it.qty) || 1);
    await db.execute({
      sql: 'UPDATE products SET stock = CASE WHEN stock < 0 THEN stock ELSE MAX(stock - ?, 0) END WHERE slug = ?',
      args: [qty, it.slug],
    });
  }
}
