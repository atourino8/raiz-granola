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
          (slug, name, tagline, description, price, weight, ingredients, tags, emoji, color, image_url, featured, active, sort_order)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          p.slug, p.name, p.tagline, p.description, p.price, p.weight,
          JSON.stringify(p.ingredients), JSON.stringify(p.tags),
          p.emoji, p.color, p.imageUrl, p.featured ? 1 : 0, p.active ? 1 : 0, p.sortOrder,
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
}

export async function upsertProduct(p: ProductInput): Promise<void> {
  await ensureSeed();
  await db.execute({
    sql: `INSERT INTO products
      (slug, name, tagline, description, price, weight, ingredients, tags, emoji, color, image_url, featured, active, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        sort_order = excluded.sort_order`,
    args: [
      p.slug, p.name, p.tagline, p.description, p.price, p.weight,
      JSON.stringify(p.ingredients), JSON.stringify(p.tags),
      p.emoji, p.color, p.imageUrl, p.featured ? 1 : 0, p.active ? 1 : 0, p.sortOrder,
    ],
  });
}

export async function deleteProductBySlug(slug: string): Promise<void> {
  await ensureSeed();
  await db.execute({ sql: 'DELETE FROM products WHERE slug = ?', args: [slug] });
}
