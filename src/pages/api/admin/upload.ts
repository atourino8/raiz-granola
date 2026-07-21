import type { APIRoute } from 'astro';
import { isVerifiedAdmin } from '../../../lib/admin';
import { put } from '@vercel/blob';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Sube una imagen a Vercel Blob y devuelve su URL publica. Solo administradores.
// Autenticacion: en Vercel se usa OIDC automaticamente (VERCEL_OIDC_TOKEN + BLOB_STORE_ID),
// asi que NO hace falta un BLOB_READ_WRITE_TOKEN estatico. En local puedes definir
// BLOB_READ_WRITE_TOKEN en tu .env y se usara si esta presente.
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isVerifiedAdmin(locals.user)) return json({ error: 'No autorizado' }, 403);

  const token =
    (typeof process !== 'undefined' ? process.env.BLOB_READ_WRITE_TOKEN : undefined) ||
    import.meta.env.BLOB_READ_WRITE_TOKEN ||
    undefined;

  const data = await request.formData();
  const file = data.get('file');
  if (!(file instanceof File)) return json({ error: 'No se recibio ningun archivo.' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: 'El archivo debe ser una imagen.' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'La imagen no puede superar 4 MB.' }, 400);

  try {
    const ext = (file.name.split('.').pop() || 'img').toLowerCase().replace(/[^a-z0-9]/g, '') || 'img';
    const key = `raiz/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(key, file, {
      access: 'public',
      contentType: file.type,
      ...(token ? { token } : {}),
    });
    return json({ url: blob.url });
  } catch (err) {
    console.error('[upload]', err);
    const msg = err instanceof Error ? err.message : 'error desconocido';
    return json({ error: 'No se pudo subir la imagen: ' + msg }, 500);
  }
};
