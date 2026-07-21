import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin';
import { upsertProduct, deleteProductBySlug, getAnyProductBySlug } from '../../../lib/catalog';

export const prerender = false;

const clean = (v: unknown) => String(v ?? '').trim();

function toSlug(v: unknown): string {
  return clean(v)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!isAdmin(locals.user)) return new Response('No autorizado', { status: 403 });

  const data = await request.formData();
  const action = String(data.get('action') ?? 'save');
  const slug = toSlug(data.get('slug'));
  if (!slug) return redirect('/admin/productos?error=slug');

  if (action === 'delete') {
    await deleteProductBySlug(slug);
    return redirect('/admin/productos?saved=1');
  }

  // Validación en servidor (no confiar solo en required del navegador).
  const name = clean(data.get('name'));
  if (name.length < 2) return redirect('/admin/productos?error=nombre');

  // Al CREAR (no editar), no permitir un slug que ya existe (evita sobrescribir).
  const editing = data.get('editing') != null;
  if (!editing && (await getAnyProductBySlug(slug))) {
    return redirect('/admin/productos?error=existe');
  }

  const priceEuros = parseFloat(String(data.get('price') ?? '0').replace(',', '.'));
  const price = Number.isFinite(priceEuros) ? Math.max(0, Math.round(priceEuros * 100)) : 0;

  const ingredients = clean(data.get('ingredients'))
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  const tags = clean(data.get('tags'))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const sortOrder = parseInt(String(data.get('sortOrder') ?? '99'), 10);

  // Stock: vacío o -1 = ilimitado; 0 = agotado; >0 = unidades disponibles.
  const stockRaw = clean(data.get('stock'));
  const stockParsed = stockRaw === '' ? -1 : parseInt(stockRaw, 10);
  const stock = Number.isFinite(stockParsed) ? stockParsed : -1;

  await upsertProduct({
    slug,
    name,
    tagline: clean(data.get('tagline')),
    description: clean(data.get('description')),
    price,
    weight: clean(data.get('weight')),
    ingredients,
    tags,
    emoji: clean(data.get('emoji')) || '🌾',
    color: clean(data.get('color')) || '#C99A3F',
    imageUrl: clean(data.get('imageUrl')),
    featured: data.get('featured') != null,
    active: data.get('active') != null,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 99,
    stock,
  });

  return redirect('/admin/productos?saved=1');
};
