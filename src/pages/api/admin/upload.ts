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

// Sube una imagen a Vercel Blob y devuelve su URL pública. Solo administradores.
export const POST: APIRoute = async ({ request, locals }) => {
  if (!isVerifiedAdmin(locals.user)) return json({ error: 'No autorizado' }, 403);

  const token =
    import.meta.env.BLOB_READ_WRITE_TOKEN ||
    (typeof process !== 'undefined' ? process.env.BLOB_READ_WRITE_TOKEN : undefined);
  if (!token) {
    return json(
      { error: 'Subida no configurada: falta BLOB_READ_WRITE_TOKEN. Usa una URL por ahora.' },
      500,
    );
  }

  const data = await request.formData();
  const file = data.get('file');
  if (!(file instanceof File)) return json({ error: 'No se recibió ningún archivo.' }, 400);
  if (!file.type.startsWith('image/')) return json({ error: 'El archivo debe ser una imagen.' }, 400);
  if (file.size > 4 * 1024 * 1024) return json({ error: 'La imagen no puede superar 4 MB.' }, 400);

  try {
    const ext = (file.name.split('.').pop() || 'img').toLowerCase().replace(/[^a-z0-9]/g, '') || 'img';
    const key = `raiz/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(key, file, { access: 'public', token, contentType: file.type });
    return json({ url: blob.url });
  } catch (err) {
    console.error('[upload]', err);
    const msg = err instanceof Error ? err.message : 'error desconocido';
    return json({ error: 'No se pudo subir la imagen: ' + msg }, 500);
  }
};
