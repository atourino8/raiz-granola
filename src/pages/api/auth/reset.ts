import type { APIRoute } from 'astro';
import { updatePassword } from '../../../lib/auth';
import { consumeToken } from '../../../lib/tokens';

export const prerender = false;

export const POST: APIRoute = async ({ request, redirect }) => {
  const data = await request.formData();
  const token = String(data.get('token') ?? '');
  const password = String(data.get('password') ?? '');

  if (password.length < 8) {
    return redirect(
      `/restablecer?token=${encodeURIComponent(token)}&error=` +
        encodeURIComponent('La contraseña debe tener al menos 8 caracteres.'),
    );
  }

  const userId = await consumeToken(token, 'reset');
  if (!userId) {
    return redirect('/restablecer?error=' + encodeURIComponent('El enlace no es válido o ha caducado.'));
  }

  await updatePassword(userId, password);
  return redirect('/login?reset=1');
};
