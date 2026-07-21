import type { APIRoute } from 'astro';
import { isVerifiedAdmin } from '../../../lib/admin';
import { setProductActive, moveProduct } from '../../../lib/catalog';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!isVerifiedAdmin(locals.user)) return new Response('No autorizado', { status: 403 });

  const data = await request.formData();
  const action = String(data.get('action') ?? '');
  const slug = String(data.get('slug') ?? '').trim();
  if (!slug) return redirect('/admin/productos');

  if (action === 'toggle') {
    await setProductActive(slug, String(data.get('active')) === '1');
  } else if (action === 'move') {
    await moveProduct(slug, String(data.get('dir')) === 'up' ? 'up' : 'down');
  }

  return redirect('/admin/productos');
};
