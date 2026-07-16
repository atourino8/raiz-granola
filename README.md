# 🌾 Raíz Granola — Tienda online

Tienda de granola artesanal con catálogo, carrito, cuentas de usuario y pagos
con Stripe. Construida con **Astro (SSR) + Tailwind + libSQL + Stripe**.

Estética pro-natural: paleta orgánica (avena, miel, bosque, terracota),
tipografía serif (Fraunces) y componentes con formas suaves.

---

## Stack

| Capa | Elección | Notas |
| --- | --- | --- |
| Framework | Astro (output `server`) | SSR con adaptador Node standalone (@astrojs/node). |
| Estilos | Tailwind CSS 4 (`@tailwindcss/vite`) | Config CSS-first: paleta y tokens en `src/styles/global.css` (`@theme`). |
| Base de datos | libSQL (`@libsql/client`) | Archivo local en dev; Turso en producción. Sin dependencias nativas → funciona en Windows sin compilador. |
| Auth | Propia (scrypt nativo + sesiones en cookie httpOnly) | Sin librerías externas. |
| Pagos | Stripe Checkout | Redirección alojada por Stripe (PCI mínimo). |
| Estado carrito | nanostores + persistencia en localStorage | |

> Nota de decisión: tu playbook (`LECCIONES.md`) recomienda **Supabase** para apps
> Tier 2 con auth/DB. Aquí se optó por libSQL + auth propia para tener un proyecto
> **autocontenido, sin cuentas externas ni lock-in**, alineado con Astro. Si prefieres
> Supabase (RLS, magic links, storage), es un cambio acotado a `src/lib/auth.ts`,
> `src/lib/db.ts` y el middleware — dímelo y lo migro.

---

## Requisitos

- **Node 18.20+** (probado con Node 22). En Windows, instala la LTS desde nodejs.org.
- Una cuenta de **Stripe** (modo test es suficiente para desarrollar).

---

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Crear tu archivo de entorno
copy .env.example .env      # Windows (PowerShell/CMD)
# cp .env.example .env       # macOS/Linux

# 3. Editar .env con tus claves (ver abajo)

# 4. Arrancar en desarrollo
npm run dev
# → http://localhost:4321
```

### Variables de entorno (`.env`)

| Variable | Para qué | Dónde conseguirla |
| --- | --- | --- |
| `DATABASE_URL` | Base de datos | Déjalo en `file:./data/raiz.db` para dev. La carpeta `data/` se crea sola. |
| `SESSION_SECRET` | Firmar sesiones | Genera una cadena larga aleatoria. |
| `STRIPE_SECRET_KEY` | Pagos (servidor) | dashboard.stripe.com → Developers → API keys (`sk_test_...`). |
| `STRIPE_PUBLISHABLE_KEY` | Pagos (cliente) | Misma pantalla (`pk_test_...`). |
| `STRIPE_WEBHOOK_SECRET` | Webhook (opcional) | Ver sección Webhook. |
| `PUBLIC_SITE_URL` | Redirecciones de Stripe | `http://localhost:4321` en dev; tu dominio en producción. |
| `ADMIN_EMAILS` | Acceso al panel /admin | Tu email (y el de tu socia), separados por comas. |
| `RESEND_API_KEY` | Emails (verificación, reset) | resend.com → API Keys. Sin ella, en local las cuentas se auto-verifican. |
| `EMAIL_FROM` | Remitente de los emails | Ej. `Raíz Granola <onboarding@resend.dev>`. |

> ⚠️ **Copia-pega las claves, no las escribas a mano** (lección 6.1 del playbook:
> un typo en el nombre de la variable falla en silencio en runtime).

Sin claves de Stripe válidas, la web funciona entera (catálogo, carrito, cuentas);
solo el botón *Ir a pagar* mostrará un aviso pidiendo configurar Stripe.

---

## Probar el pago (modo test)

1. Añade productos a la cesta → **Ir a pagar**.
2. En Stripe Checkout usa la tarjeta de prueba `4242 4242 4242 4242`, fecha futura y CVC cualquiera.
3. Tras pagar, vuelves a `/checkout/exito` y el pedido pasa a `paid`.

### Webhook (opcional, recomendado en producción)

El estado del pedido se confirma también en la página de éxito, pero lo robusto
es el webhook:

```bash
# con Stripe CLI en local
stripe listen --forward-to localhost:4321/api/webhook
# copia el whsec_... que imprime a STRIPE_WEBHOOK_SECRET en .env
```

En producción, crea el endpoint en el dashboard apuntando a
`https://tudominio.com/api/webhook` (evento `checkout.session.completed`).

---

## Estructura

```
src/
├── layouts/Layout.astro         ← cabecera, pie, fuentes, estilos globales
├── components/
│   ├── Header.astro             ← nav + contador de cesta
│   ├── Footer.astro
│   ├── ProductCard.astro
│   └── CartScripts.astro        ← lógica global "añadir a cesta" + toast
├── lib/
│   ├── db.ts                    ← cliente libSQL + creación de tablas
│   ├── auth.ts                  ← hash scrypt, sesiones, usuarios
│   ├── products.ts              ← catálogo (fuente de datos tipada)
│   ├── cart.ts                  ← store del carrito (nanostores)
│   └── stripe.ts                ← cliente Stripe perezoso
├── middleware.ts                ← carga el usuario + cabeceras de seguridad
└── pages/
    ├── index.astro              ← home / landing
    ├── tienda.astro             ← catálogo
    ├── producto/[slug].astro    ← ficha de producto
    ├── carrito.astro            ← cesta + checkout
    ├── nosotros.astro
    ├── cuenta.astro             ← pedidos (requiere login)
    ├── login.astro · registro.astro
    ├── checkout/exito.astro
    └── api/
        ├── auth/{login,register,logout}.ts
        ├── checkout.ts          ← crea la sesión de Stripe (recalcula precios en servidor)
        └── webhook.ts           ← confirma pago
```

El catálogo vive en la tabla `products` de la base de datos y se gestiona desde
`/admin`. `src/lib/products.ts` solo contiene los datos semilla que pueblan la DB
la primera vez. Las fotos se añaden por URL desde el panel.

---

## Panel de administración

Entra en `/admin` con una cuenta cuyo email esté en `ADMIN_EMAILS`. Desde ahí
puedes gestionar **productos** (crear, editar, borrar, foto por URL), ver y
actualizar el estado de los **pedidos**, y editar los **textos** de la home y de
"Nuestra historia". Los productos viven en la base de datos, así que el checkout
siempre valida el precio real contra la DB.

---

## Build y despliegue

```bash
npm run build      # genera dist/ (servidor Node standalone)
npm run preview    # sirve el build: node ./dist/server/entry.mjs
```

Despliegue: cualquier host con Node (Railway, Render, Fly, VPS) o adaptar a
Vercel/Netlify cambiando el adaptador en `astro.config.mjs`. En producción usa
**Turso** para `DATABASE_URL` (libSQL gestionado) en vez del archivo local.

---

## ✅ Checklist antes de cada push (adaptado de tu playbook)

```
[ ] npm install sin errores
[ ] npm run dev levanta en http://localhost:4321
[ ] DevTools → Console: 0 errores en rojo
[ ] DevTools → Network: recursos en 200
[ ] Registro de usuario + login + logout funcionan
[ ] Añadir a cesta, cambiar cantidades, eliminar
[ ] "Ir a pagar" con tarjeta 4242… completa el flujo y vuelve a /checkout/exito
[ ] El pedido aparece en /cuenta como "Pagado"
[ ] Mobile: probado en modo responsive
[ ] npm run build termina sin errores
[ ] git status: nada inesperado antes de commitear
```

> ⚠️ Estado actual: el código está escrito y revisado (sintaxis, bytes, tipos),
> pero **el `npm install`/`build` no se pudo ejecutar en el entorno donde se generó**
> (registro de npm bloqueado). Corre el checklist en tu máquina antes de dar nada
> por bueno — lección 8.1: *verificar antes de anunciar*.
