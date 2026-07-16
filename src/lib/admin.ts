// Control de acceso al panel /admin.

export function isAdmin(user: { email: string } | null | undefined): boolean {
  if (!user) return false;
  const raw = import.meta.env.ADMIN_EMAILS ?? '';
  const list = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(user.email.toLowerCase());
}

// Admin efectivo: debe estar en ADMIN_EMAILS Y tener el email verificado.
// Así, aunque alguien registre el email admin, no entra sin verificar el correo.
export function isVerifiedAdmin(
  user: { email: string; emailVerified?: boolean } | null | undefined,
): boolean {
  return isAdmin(user) && !!user?.emailVerified;
}
