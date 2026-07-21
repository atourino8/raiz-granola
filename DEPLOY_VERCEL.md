# 🚀 Desplegar Raíz Granola en Vercel

Guía paso a paso para publicar la tienda en Vercel y compartirla.
Método: **GitHub + Vercel** · Base de datos: **Turso** · Stripe: **modo test**.

> Sigue el orden. Los avisos ⚠️ vienen de tu playbook (Parte 6) para no repetir
> los errores de deploys anteriores.

---

## Cuentas que necesitas (gratis)

- **GitHub** — https://github.com
- **Vercel** — https://vercel.com (entra con tu GitHub)
- **Turso** — https://turso.tech (base de datos)

---

## Paso 1 · Cambiar el adaptador a Vercel

En la carpeta del proyecto, en PowerShell:

```powershell
npx astro add vercel
```

Acepta cuando pregunte (`y`). Esto instala `@astrojs/vercel` y ajusta
`astro.config.mjs` con la versión correcta.

> ⚠️ Deja que el comando edite la config él mismo — así evitas el desajuste
> de versión de adaptador (lección 6.1). Opcional: `npm uninstall @astrojs/node`
> para quitar el adaptador viejo que ya no se usa.

Comprueba que sigue arrancando en local:

```powershell
npm run dev
```

---

## Paso 2 · Crear la base de datos en Turso

El fichero local `data/raiz.db` NO sirve en Vercel (disco efímero). Usamos Turso,
que es libSQL alojado y no requiere cambiar el código.

**Opción A — Web (más fácil):** entra en https://turso.tech, crea una base de
datos y, en su panel, copia la **Database URL** (`libsql://...`) y genera un
**Auth Token**.

**Opción B — CLI:**

```powershell
# instalar CLI (o usar scoop/WSL); luego:
turso auth login                         # se abre el navegador
turso db create raiz-granola
turso db show raiz-granola --url         # -> DATABASE_URL (libsql://...)
turso db tokens create raiz-granola      # -> DATABASE_AUTH_TOKEN
```

Guarda esos dos valores, los necesitarás en el Paso 5.

---

## Paso 3 · Subir el código a GitHub

⚠️ Antes de nada: confirma que `.env` NO se sube (contiene secretos). Ya está en
`.gitignore`, pero verifícalo con `git status` — no debe aparecer `.env`.

```powershell
git init
git add .
git status                 # revisa que NO aparezca .env ni node_modules ni data/
git commit -m "Raíz Granola: tienda inicial"
```

Crea un repo **privado** en GitHub (sin README) y conéctalo:

```powershell
git remote add origin https://github.com/TU-USUARIO/raiz-granola.git
git branch -M main
git push -u origin main
```

---

## Paso 4 · Importar el proyecto en Vercel

1. En https://vercel.com → **Add New… → Project**.
2. Importa el repo `raiz-granola`.
3. Framework preset: **Astro** (lo detecta solo). No cambies el build command.
4. **Antes de pulsar Deploy**, ve a *Environment Variables* (Paso 5).
5. En *Settings → General → Node.js Version*, elige **22.x**.

> ⚠️ Fija la versión de Node explícitamente (lección 6.1: el adaptador puede no
> soportar la versión más nueva por defecto).

---

## Paso 5 · Variables de entorno (¡el paso crítico!)

Añádelas **en el proyecto** (Settings → Environment Variables), marcadas para
*Production*, *Preview* y *Development*:

| Variable | Valor |
| --- | --- |
| `DATABASE_URL` | La `libsql://...` de Turso |
| `DATABASE_AUTH_TOKEN` | El token de Turso |
| `SESSION_SECRET` | Una cadena larga aleatoria (ver abajo) |
| `STRIPE_SECRET_KEY` | `sk_test_...` (o déjala con el placeholder por ahora) |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `PUBLIC_SITE_URL` | La URL de Vercel (la sabrás tras el primer deploy) |
| `ADMIN_EMAILS` | Tu email y el de tu socia (separados por comas) para entrar en /admin |
| `RESEND_API_KEY` | Clave de Resend (resend.com) para enviar verificación y reset |
| `EMAIL_FROM` | Remitente, ej. `Raíz Granola <onboarding@resend.dev>` |
| `BLOB_READ_WRITE_TOKEN` | Subida de imágenes. Se crea solo al añadir un **Blob store** en Vercel (Storage → Create → Blob) |

Genera `SESSION_SECRET` en PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> ⚠️ Tres reglas de oro del playbook (lección 6.1):
> 1. **A nivel PROYECTO, no Team** — si no, no se inyectan.
> 2. **Copia-pega los valores, no los escribas a mano** — un typo falla en silencio.
> 3. **Tras añadir/editar variables, haz Redeploy** (Deployments → ⋯ → Redeploy).
>    Vercel no reconstruye solo al cambiar variables.

---

## Paso 6 · Desplegar y comprobar

1. Pulsa **Deploy**. Espera a que quede verde.
2. Copia la URL (`https://raiz-granola-xxxx.vercel.app`).
3. Vuelve al Paso 5 y pon esa URL en `PUBLIC_SITE_URL` → **Redeploy**.
4. Comparte la URL con tu socia. 🎉

### Prueba rápida (smoke test)

```
[ ] La home carga con estilos (si se ve sin CSS, revisa el deploy de Tailwind)
[ ] /tienda muestra los productos
[ ] Registro de una cuenta funciona (esto confirma que Turso está conectado)
[ ] Login y logout funcionan
[ ] Añadir a la cesta y ver /carrito
```

> ⚠️ Si la web muestra una versión antigua: comprueba **qué commit está en
> Production** (no asumas que es el último push). Si algún deploy falló, Vercel
> mantiene el último verde (lección 6.1).

---

## Cuando queráis cobrar de verdad (más adelante)

- Cambia las claves de Stripe a `sk_live_...` / `pk_live_...` en Vercel + Redeploy.
- Crea el webhook en Stripe apuntando a `https://tudominio/api/webhook` y pon
  `STRIPE_WEBHOOK_SECRET`.
- Revisa el `TRASPASO.md` para el checklist de entrega.
