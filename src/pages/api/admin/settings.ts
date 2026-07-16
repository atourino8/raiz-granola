import type { APIRoute } from 'astro';
import { isAdmin } from '../../../lib/admin';
import { setSetting, settingLabels } from '../../../lib/settings';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  if (!isAdmin(locals.user)) return new Response('No autorizado', { status: 403 });

  const data = await request.formData();
  for (const key of Object.keys(settingLabels)) {
    if (data.has(key)) {
      await setSetting(key, String(data.get(key) ?? ''));
    }
  }
  return redirect('/admin/textos?saved=1');
};
