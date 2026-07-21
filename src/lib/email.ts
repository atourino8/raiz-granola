// Envío de emails con Resend (https://resend.com) vía su API REST.
// Sin dependencias: usamos fetch. Si no hay clave, no se envía (modo dev).

const KEY = import.meta.env.RESEND_API_KEY;
const FROM = import.meta.env.EMAIL_FROM ?? 'Raíz Granola <onboarding@resend.dev>';

export const emailEnabled = Boolean(KEY && !KEY.includes('xxxx'));

async function send(to: string, subject: string, html: string): Promise<boolean> {
  if (!emailEnabled) {
    console.warn('[email] RESEND_API_KEY no configurada: no se envía el correo.');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) {
      console.error('[email] Resend respondió', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] error de red', err);
    return false;
  }
}

function wrap(title: string, body: string, cta: { href: string; label: string }): string {
  return `
  <div style="font-family:system-ui,sans-serif;background:#FAF6EE;padding:32px">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #EDE3D2">
      <p style="font-size:22px;font-weight:700;color:#37503B;margin:0 0 8px">🌾 Raíz Granola</p>
      <h1 style="font-size:20px;color:#3A2E24;margin:0 0 12px">${title}</h1>
      <p style="color:#5b5045;line-height:1.6">${body}</p>
      <p style="margin:28px 0">
        <a href="${cta.href}" style="background:#37503B;color:#FAF6EE;text-decoration:none;padding:12px 24px;border-radius:999px;font-weight:600">${cta.label}</a>
      </p>
      <p style="color:#9a8f80;font-size:13px">Si no has sido tú, ignora este correo.</p>
    </div>
  </div>`;
}

export function sendVerificationEmail(to: string, url: string): Promise<boolean> {
  return send(
    to,
    'Verifica tu email · Raíz Granola',
    wrap(
      'Confirma tu cuenta',
      'Gracias por registrarte. Confirma tu email para activar tu cuenta:',
      { href: url, label: 'Verificar mi email' },
    ),
  );
}

export function sendOrderShippedEmail(to: string, orderId: number, site: string): Promise<boolean> {
  return send(
    to,
    `Tu pedido #${orderId} va en camino · Raíz Granola`,
    wrap(
      '¡Tu pedido va en camino! 📦',
      `Hemos preparado y enviado tu pedido #${orderId}. Gracias por confiar en nosotros.`,
      { href: `${site}/cuenta`, label: 'Ver mis pedidos' },
    ),
  );
}

export function sendPasswordResetEmail(to: string, url: string): Promise<boolean> {
  return send(
    to,
    'Restablece tu contraseña · Raíz Granola',
    wrap(
      'Restablecer contraseña',
      'Has pedido cambiar tu contraseña. Pulsa el botón (el enlace caduca en 2 horas):',
      { href: url, label: 'Cambiar contraseña' },
    ),
  );
}
