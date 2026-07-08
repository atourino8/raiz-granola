# Lecciones aprendidas · freelance playbook

Documento vivo. Captura todo lo que sirvió y todo lo que no, para reutilizar
en futuros proyectos. Dos partes: **técnica** (cómo construir) y **comercial**
(cómo vender, cobrar, traspasar).

Proyectos cubiertos:
- **Can Ficus** (web estática + Decap CMS, junio 2026).
- **Coachify** (SaaS B2B con SvelteKit + Supabase + Vercel, junio 2026).

Última revisión: 24 de junio de 2026.

---

## PARTE 1 · TÉCNICA

### 1.1 Errores cometidos y cómo evitarlos

| Error | Síntoma | Causa raíz | Cómo evitarlo |
| --- | --- | --- | --- |
| **Comentario JS sin cerrar tras Edit** | "currentLang is not defined" en consola del navegador, pero `new Function()` decía OK | Un Edit fusionó `/* ============ */` con la línea siguiente. El `*/` desapareció y el comentario engulló las declaraciones críticas. | Validar SIEMPRE con servidor HTTP local + abrir el navegador y mirar la consola antes de commitear. `new Function()` no detecta comentarios mal cerrados. |
| **Archivos HTML enormes con todo embebido** | Cada Edit pequeño truncaba el archivo a mitad del JS | El sistema de Edit/Write tiene un bug de sincronización con archivos grandes (>40 KB). Vista virtual y filesystem real desincronizan. | Modularizar: CSS y JS en archivos separados desde el día 1. Archivos < 500 líneas siempre que sea posible. |
| **Bytes nulos literales en regex** | El HTML servido se cortaba en medio de página (navegador rechaza bytes nulos) | Escribí `/[ -]+/` con caracteres de control literales en lugar de `/[\x00-\x1F]+/` | Para rangos de caracteres no imprimibles, **siempre** notación de escape `\xNN` o `\uNNNN`. Nunca pegar caracteres binarios en un editor. |
| **`mailto:` header injection** | Potencial inyección de Bcc/Cc vía CRLF en el campo nombre | `encodeURIComponent` no neutraliza CRLF; algunos clientes de correo los decodifican como cabeceras | Función `sanitize()` que strip caracteres de control antes de meter cualquier input en mailto/wa.me. |
| **Fetch sin servidor falla en local** | "Si abres con doble clic, no funciona" | `file://` bloquea fetch por CORS | Documentarlo siempre. Recordatorio en README + fallback elegante en la UI. Considerar pre-render si es crítico. |
| **Carpeta huérfana añadida al repo Git** | Netlify falla con "Cannot init submodule 'Can Ficus'" | `git add .` añadió una carpeta vacía con su propio `.git` dentro como submódulo | Antes de `git add .`, comprobar con `ls` que no hay carpetas residuales. Y `git status` antes de cualquier commit. |
| **Token de invitación quemado** | "User not found" tras aceptar invitación de Netlify Identity | El link de invitación va a `/` (home) pero el widget de Identity solo vive en `/admin/`. Token consumido sin completar setup. | Añadir el widget de Identity en TODA página pública para capturar invite_token y redirigir al `/admin/`. |
| **Cuentas en nombre del desarrollador** | Cliente no es propietario real de su web | "Crear cuenta rápido con mi email" durante la fase de desarrollo | Cuentas del cliente desde el día 1, con su email, 2FA activado. Tú entras como colaborador, no como dueño. |

### 1.2 Buenas prácticas confirmadas

- **JSON estático en repo + Decap CMS** es excelente para webs informativas (restaurantes, agencias, portfolios). Coste 0 €, velocidad máxima, seguridad alta por diseño.
- **5 idiomas con `data-i18n` + `data-content` mixto**: separar textos del sistema (nav, formularios) de los textos editables. Mantenibilidad altísima.
- **Sanitize universal de inputs** antes de cualquier acción (mailto, wa.me, URLs): elimina la mayoría de los vectores de inyección.
- **Honeypot anti-bot**: 4 líneas que filtran ~95 % del spam automatizado sin pedir CAPTCHA al usuario real.
- **CSS variables para imágenes en pseudo-elementos**: si el hero usa `::before` con background, una variable `--hero-img` permite sobrescribirla con JS.
- **Headers de seguridad vía `netlify.toml`**: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Suben la nota en `securityheaders.com` y son gratuitos.
- **Cache largo para `/img/*` + cache corto para `/content/*`**: las fotos son inmutables; los datos del CMS deben verse rápido al editar.
- **JSON-LD de tipo `Restaurant`** (u otro `LocalBusiness`): mejora drásticamente la indexación en Google y la aparición en Maps.
- **TRASPASO.md desde el principio**: con campos en blanco para rellenar el día de la entrega.

### 1.3 Stack que funcionó bien (Tier 1 — webs estáticas)

| Capa | Elección | Cuándo usar |
| --- | --- | --- |
| Hosting | Netlify | Web estática, 100 GB/mes, free tier. |
| CMS | Decap CMS + Git Gateway | Cliente edita texto/fotos sin tocar código. |
| Auth admin | Netlify Identity (invite only) | Hasta 5 usuarios gratis. |
| Repo | GitHub (private) | Versionado y backup. |
| Dominio | Cloudflare Registrar | Precio a coste, sin sobrecoste. |
| Fonts | Google Fonts | Tipografía profesional, gratis. |
| Mapa | OpenStreetMap embed | Sin API key, sin tracking de Google. |
| Imágenes generadas | PIL + gradientes y ruido | Placeholders bonitos antes de tener fotos propias. |

### 1.4 Stack pendiente de probar (Tier 2 — apps con backend)

Para proyectos con autenticación multi-usuario, base de datos y storage de
ficheros (típico: marketplaces, plataformas SaaS pequeñas, apps internas):

| Capa | Elección | Por qué |
| --- | --- | --- |
| Backend / DB / Auth | Supabase | Postgres + Auth + Storage + RLS en una cuenta. Free tier 500 MB. |
| Frontend | SvelteKit (preferido) o Astro+Vue | App reactiva sin la sobrecarga de React/Next. Curva suave. |
| Vídeos / media pesada | Cloudinary (free 25 GB) o Bunny.net Stream | CDN global + transcoding automático. |
| Hosting | Vercel o Netlify | Despliegue automático desde GitHub. SvelteKit nativo. |
| Email transaccional | Resend (free 3K/mes) o Loops | Mejor que SMTP propio. |

### 1.5 Stack a evitar (o usar con cuidado)

- **WordPress**: para webs informativas modernas, es overkill. Lo que tarda en mantener (plugins, updates, seguridad) supera lo que ahorra en montarlo.
- **Wix/Squarespace**: parecen baratos pero cobran por siempre y locken al cliente. Sin valor diferencial frente a Decap+Netlify.
- **Firebase para apps relacionales**: si los datos son relacionales (cliente→entrenamiento→ejercicios), Postgres en Supabase encaja mucho mejor que Firestore.
- **Caracteres binarios en JS**: ya explicado arriba.
- **Apilar Edits sobre el mismo archivo HTML grande**: ya explicado.

### 1.6 Checklist técnico antes de cada push

```
[ ] Servidor HTTP local levantado (python -m http.server / npx serve)
[ ] Página principal abierta en navegador
[ ] DevTools → Console: 0 errores en rojo
[ ] DevTools → Network: todos los recursos en 200
[ ] Cambio de idioma reaplicado correctamente
[ ] Formulario probado (con datos válidos e inválidos)
[ ] Mobile: probado con DevTools en modo responsive
[ ] git status: nada inesperado
[ ] git log: el commit message describe lo que cambió
[ ] git push: confirmar "Your branch is up to date"
[ ] Netlify deploy verde
[ ] Refresco con Ctrl+Shift+R en producción y verificación visual
```

---

## PARTE 2 · COMERCIAL

### 2.1 Modelos de relación cliente

Tres modelos limpios. Elige antes de presupuestar:

**Modelo A — "Llave en mano sin mantenimiento"**

- Cliente paga una sola vez. Se le entregan las cuentas.
- Tú firmas disclaimer claro: "cualquier cambio futuro requiere contratar a un desarrollador".
- ✅ Bueno para: amigos cercanos que no quieren atarse, webs informativas estables que no van a cambiar.
- ❌ Malo para: apps con backend, datos de usuarios, vídeo. Algo se va a romper en 6-12 meses.

**Modelo B — "Llave en mano + mantenimiento mensual"**

- Cliente paga inicial + cuota mensual de 25-80 €.
- Mantenimiento incluye: backups, monitorización, 1-2 horas/mes de cambios pequeños, atender bugs sin facturar aparte.
- ✅ Bueno para: clientes con quien quieres relación a largo plazo, apps con backend, negocios que necesitan fiabilidad.
- Es el modelo profesional sano. Si el cliente lo rechaza, considera si quieres el proyecto.

**Modelo C — "Yo pago la infraestructura"**

- Tú mantienes las cuentas. El cliente paga cuota mensual que incluye hosting + tu tiempo.
- ✅ Bueno para: ingreso recurrente garantizado, control total.
- ❌ Malo para: el cliente está en lock-in. Si dejas de pagar tú, la web cae. Un cliente avispado lo verá rápido.

### 2.2 Cómo presupuestar (rangos reales en España 2026)

| Tipo de proyecto | Horas | €/h amigo | €/h pro | Total amigo | Total pro |
| --- | --- | --- | --- | --- | --- |
| Web informativa estática (1 página, 2 idiomas) | 12–20 | 30 | 50 | 400-600 € | 600-1000 € |
| Web restaurante tipo Can Ficus | 30–50 | 35 | 50 | 1.000-1.800 € | 1.500-2.500 € |
| Landing + CRM básico para una PYME | 40–70 | 40 | 55 | 1.600-2.800 € | 2.200-3.850 € |
| App con auth + DB + media (tipo entrenador) | 80–120 | 35 | 55 | 2.800-4.200 € | 4.400-6.600 € |
| E-commerce a medida | 100–200 | 40 | 60 | 4.000-8.000 € | 6.000-12.000 € |

**Reglas:**

- Si pides menos del rango "amigo", estás perdiendo dinero y atrayendo malos clientes.
- Si pides más del rango "pro" sin ser una agencia, pierdes el deal frente a alternativas.
- Suma siempre un **20–30 % de buffer** para imprevistos. Los hay. Siempre.
- Cuota de mantenimiento ≈ **1-3 % del coste de desarrollo / mes**. Web de 2.000 € → 30-60 €/mes.

### 2.3 Cómo traspasar a un cliente sin perder la cabeza

**Antes de empezar a programar:**

1. Confirma por escrito (email basta) el alcance, el coste y los plazos.
2. Decide modelo de relación (A, B o C).
3. Decide quién compra el dominio.
4. Decide qué cuentas creará el cliente y cuáles tú.
5. Pide un 30-50 % por adelantado para arrancar.

**Durante el desarrollo:**

1. **Cuentas del cliente** (GitHub, Netlify, Cloudinary, registrar): que las cree él, con su email, 2FA activado. Tú entras como colaborador.
2. Trabaja en una **rama o repo intermedio si no quieres que vea el código en proceso**. Para amigos no merece la pena.
3. Hitos cada 2-3 días con captura/URL temporal. Mantén al cliente involucrado.

**El día del traspaso:**

1. Sentados juntos (en persona o videollamada).
2. Rellena el `TRASPASO.md` con sus datos delante de él.
3. Activa todas las cuentas con su email definitivo si no estaban.
4. Que él haga un cambio en el panel admin contigo al lado. Hasta que no lo haga, no es "suyo".
5. Cobra el resto del importe.
6. Firma el disclaimer (un párrafo en `TRASPASO.md` basta) sobre qué incluye y qué no la entrega.

**Después del traspaso:**

1. Envío email de cortesía a los 7 días: "¿todo bien?". Crea recuerdo positivo.
2. Si Modelo B (con mantenimiento), agenda recordatorio mensual de revisar uptime y enviar resumen.
3. Mantén tus credenciales en el llavero pero **borra contraseñas innecesarias** que ya no controles.

### 2.4 Plantilla de email de propuesta

```
Hola [nombre],

Te paso el resumen de lo hablado.

ALCANCE
- Web one-page con sección de carta
- 5 idiomas (ES, EN, DE, FR, IT)
- Formulario de reservas por email + WhatsApp
- Panel de administración para que edites carta, fotos y horarios

FUERA DEL ALCANCE
- Sesión de fotos profesional
- Logo profesional (uso provisional)
- Integración con sistemas de reserva en tiempo real (TheFork, etc.)

COSTE
- Desarrollo + despliegue: ___ € (IVA aparte)
- Mantenimiento mensual: ___ €/mes (opcional)
- Dominio: ~12 €/año (lo compras tú directamente)

PLAZOS
- Maqueta para revisar: __ días desde confirmación
- Web online en pruebas: __ días
- Entrega final: __ días

CONDICIONES
- 50 % al confirmar / 50 % al entregar
- Tras la entrega, cualquier cambio nuevo se valora aparte

¿Confirmamos para arrancar la semana del __?

Un abrazo.
```

### 2.5 Disclaimer a incluir SIEMPRE en TRASPASO.md

> Esta web se entrega en estado funcional, sin compromiso de mantenimiento
> continuado por parte del desarrollador. El cliente acepta que cualquier
> modificación posterior (añadir secciones, corregir bugs, actualizar
> dependencias, migrar tecnologías) requiere contratar a un desarrollador
> profesional. Las cuentas de [GitHub, Netlify, Cloudinary, registrar] son
> propiedad del cliente. La continuidad del servicio depende de que el
> cliente renueve el dominio anualmente y mantenga sus cuentas activas.
> El cliente declara haber recibido la guía de uso y haber realizado al
> menos una modificación de prueba en el panel de administración.

Firmado: ______________________
Fecha: ________________________

---

## PARTE 3 · PLANTILLAS REUTILIZABLES

### 3.1 Estructura inicial de proyecto web informativo

```
proyecto/
├── index.html              ← landing
├── carta.html / servicios.html / ...
├── admin/
│   ├── index.html          ← UI Decap CMS
│   └── config.yml          ← qué edita el cliente
├── content/
│   ├── inicio.json         ← textos home
│   ├── info.json           ← contacto, horarios
│   └── ...                 ← según secciones
├── img/                    ← fotos (suben desde el panel)
├── favicon.svg + variantes PNG
├── og-image.jpg            ← 1200x630 para compartir
├── netlify.toml            ← headers seguridad, cache, redirects
├── sitemap.xml + robots.txt
├── README.md               ← técnico
└── TRASPASO.md             ← cliente
```

### 3.2 Documentos a generar SIEMPRE

| Documento | Para quién | Cuándo |
| --- | --- | --- |
| `README.md` | Desarrollador (tú o el siguiente) | Mientras desarrollas |
| `TRASPASO.md` | Cliente final | Antes del traspaso, rellenar el día |
| Email de propuesta | Cliente, ANTES de empezar | Tras la reunión de scoping |
| Disclaimer firmado | Ambos | El día de la entrega |

### 3.3 Comandos PowerShell útiles

```powershell
# Servidor local rápido sin Python
npx.cmd serve

# Habilitar scripts de PowerShell (permanente, una vez por máquina)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Verificar HTML en bloc
(Get-Content archivo.html).Count
Get-Content archivo.html -Tail 5

# Git: estado claro antes de tocar nada
git status
git log --oneline -5

# Git: cambiar el remote tras transferir repo
git remote set-url origin https://github.com/NUEVO-USUARIO/repo.git
```

---

## PARTE 4 · CHECKLIST POR FASE

### 4.1 Fase 0 — Scoping (antes de presupuestar)

- [ ] Reunión presencial o videollamada de 1 h
- [ ] Brief escrito tras la reunión, enviado por email
- [ ] Confirmación expresa del cliente sobre alcance
- [ ] Modelo de relación elegido (A / B / C)
- [ ] Presupuesto enviado por email con desglose

### 4.2 Fase 1 — Pre-desarrollo

- [ ] 50 % por adelantado cobrado
- [ ] Cuentas del cliente creadas con su email + 2FA
- [ ] Repo en GitHub creado (privado)
- [ ] Tarea creada en gestor (Notion, Trello, lo que uses) con hitos
- [ ] Stack confirmado
- [ ] Carpeta de proyecto inicializada con la estructura de 3.1

### 4.3 Fase 2 — Desarrollo

- [ ] Hitos cada 2-3 días con URL/captura compartida
- [ ] Después de cada cambio importante: servidor local + consola del navegador
- [ ] Commits pequeños con mensajes claros
- [ ] README actualizado conforme avanza

### 4.4 Fase 3 — Despliegue

- [ ] Netlify conectado al repo
- [ ] Headers de seguridad activos (`netlify.toml`)
- [ ] HTTPS automático funcionando
- [ ] Dominio propio configurado (si aplica)
- [ ] Panel admin probado por ti
- [ ] Cliente invitado, se loguea y edita una cosa

### 4.5 Fase 4 — Traspaso

- [ ] `TRASPASO.md` rellenado en presencia del cliente
- [ ] Cliente realiza una modificación en vivo
- [ ] Disclaimer firmado
- [ ] Saldo cobrado
- [ ] Email de cortesía agendado a 7 días
- [ ] Mantenimiento mensual configurado (si modelo B)

### 4.6 Fase 5 — Post-traspaso

- [ ] Email cortesía a 7 días
- [ ] Revisión mensual si modelo B (uptime, backups, dependencias)
- [ ] Renovación anual: recordar al cliente fecha de renovación de dominio

---

## PARTE 5 · IDEAS A FUTURO (backlog del playbook)

Cosas que merecería la pena codificar en plantillas reutilizables algún día:

- **Starter `restaurant-static-cms`**: el código de Can Ficus limpiado, sin nombres hardcodeados, listo para clonar y rellenar.
- **Starter `trainer-app`**: SvelteKit + Supabase + Cloudinary, con auth, RLS y modelo base.
- **Starter `landing-pyme`**: web genérica de servicios (consultoría, abogados, fisios…).
- **Generador de favicons + OG images** desde un YAML de marca (color, letra, nombre).
- **Validador de proyecto** pre-commit: corre el servidor, abre headless Chrome, valida que la consola está limpia.
- **Email transaccional listo**: formulario que va a Resend/Loops en vez de mailto.

---

## PARTE 6 · LECCIONES DE COACHIFY (Tier 2 — apps con backend)

Coachify es SvelteKit + Supabase + Vercel. Las lecciones aquí solo aplican a
apps con autenticación real, base de datos y deploy serverless. Para webs
estáticas, las de Can Ficus siguen siendo la guía.

### 6.1 Errores cometidos en Coachify

| Error | Síntoma | Causa raíz | Cómo evitarlo |
| --- | --- | --- | --- |
| **`$env/static/public` rompe el build si la var falta** | Vercel build error: `"PUBLIC_X" is not exported by virtual:env/static/public` | SvelteKit valida las env vars en build time cuando usas `static`. Si Vercel no las tiene configuradas, el build falla aunque el código sea correcto. | Para variables que se leen server-side en hooks, usar `$env/dynamic/public`. Para client-side cuando deben estar disponibles, `static` está bien pero asegurar config en Vercel ANTES del primer push. |
| **Adapter Vercel no soporta Node 24** | "Building locally with unsupported Node.js version: v24.17.0" | El adapter por defecto autodetecta el runtime, y la lista de soportados va por detrás de Node Current. | En `svelte.config.js`, especificar runtime explícito: `adapter({ runtime: 'nodejs22.x' })`. O instalar Node 22 LTS local con nvm-windows. |
| **EPERM symlink en Windows local** | `npm run build` falla con `EPERM: operation not permitted, symlink` | El adapter-vercel crea symlinks que Windows bloquea sin Developer Mode. | Activar Developer Mode en Windows (Settings → For developers). O simplemente no buildear local — usar `npm run dev` para desarrollo, Vercel hace el build real. |
| **Env vars Team vs Project** | App deployada pero el cliente no carga datos / muestra versión antigua | En Vercel hay variables a nivel Team (compartidas) y a nivel Project. Por defecto las del Team NO se inyectan al proyecto. | Añadir env vars desde la página del PROYECTO concreto, no del Team. Ruta: `vercel.com/[team]/[proyecto]/settings/environment-variables`. |
| **No redeploy tras añadir env vars** | Mismas vars correctas pero app sigue sin funcionar | Vercel no rebuilda automáticamente al añadir vars. El build existente no las tiene. | Tras añadir vars: Deployments → último → ⋯ → Redeploy (sin cache). O un push vacío: `git commit --allow-empty -m "Redeploy"`. |
| **Vercel sirve último deploy verde como Production** | Producción muestra versión muy antigua aunque hay commits nuevos | Si todos los deploys recientes han fallado, Vercel mantiene activo el último verde, que puede ser de hace semanas. | Verificar **qué commit está en Production**, no asumir que es el último push. Si Production está obsoleto: arreglar errores, redeploy, "Promote to Production" si hace falta. |
| **Typo en nombre de env var** | App buildea verde pero falla silenciosamente en runtime | `PUBASE_SUPABASE_ANON_KEY` en lugar de `PUBLIC_...`. SvelteKit con `dynamic` no rompe el build si falta, la var queda como undefined y el cliente Supabase no conecta. | Copy-paste de los nombres desde el `.env.local` al panel de Vercel. **Nunca escribirlos a mano**. Y verificar el listado tras añadirlos. |
| **Recursión infinita en RLS de profiles** | Login devuelve `42P17 infinite recursion detected in policy for relation "profiles"` | Una policy de `profiles` hacía subquery a `profiles` → bucle. Postgres evalúa todas las policies SELECT, basta con que UNA recurra para que ROMPA toda la query. | Usar **helper functions con `SECURITY DEFINER`** (`current_user_coach_id()`) que leen profiles bypassando RLS. Las policies llaman a la función en vez de subquery directo. |
| **Trigger no leía coach_id desde metadata** | Al invitar cliente con `inviteUserByEmail({ data: { coach_id } })`, el profile creado tenía `coach_id = NULL` | El trigger `handle_new_user` solo leía `role` y `full_name` de `raw_user_meta_data`. | Ampliar el trigger para leer también `coach_id`. Migración 0004 en Coachify. |
| **Cliente invitado entra sin contraseña y queda atascado** | Tras aceptar email de invitación va directo al dashboard. Si cierra sesión y vuelve, "credenciales incorrectas" porque nunca puso password. | Magic link de invite establece sesión pero no contraseña. Asumí que Supabase forzaría el flujo. | Crear página intermedia `/set-password`. En la action `invite`, pasar `?invite=1` en el `redirectTo`. El callback detecta ese flag y redirige a `/set-password` antes del dashboard. |
| **Callback server-side no veía tokens de invitación** | Tras aceptar link de invite: `/login?error=missing-code#access_token=...` | Supabase usa DOS flujos distintos: PKCE (signup) manda `?code=` en query, implicit (invitaciones) manda `#access_token=` en el HASH. Los hashes nunca llegan al servidor. Mi callback server-side solo veía PKCE. | Convertir el callback a **client-side** (`+page.svelte` en vez de `+server.ts`). El cliente browser ve tanto query como hash, y con `detectSessionInUrl: true` (default en `createBrowserClient`) procesa automáticamente el hash. |
| **Rate limit en emails de Supabase free** | "email rate limit exceeded" al invitar al 3º o 4º cliente | Free tier permite ~4 emails/hora. Crítico durante desarrollo (testeas re-invitando). | Para desarrollo: usar emails reales que tengas a mano (no quemar inboxes). Para producción: configurar **SMTP propio** (Resend, AWS SES, Mailgun) en Supabase → Authentication → SMTP Settings. Quita el rate limit. |

### 6.2 Buenas prácticas confirmadas

- **Migraciones SQL versionadas en carpeta `supabase/migrations/`** (`0001_initial.sql`, `0002_fix.sql`…). Aunque no uses Supabase CLI todavía, mantener el orden en el repo. El día que adoptes la CLI o cambies de DB, lo agradeces.
- **`SECURITY DEFINER` helpers** para todo lo que recursaría en RLS. Funciones simples que devuelven `auth.uid()`-derivado y se usan en las policies.
- **`safeGetSession()` helper en hooks.server.ts**: valida el JWT vía `getUser()` antes de confiar en la sesión. Si solo usas `getSession()`, un atacante puede inyectar un JWT inválido vía cookie.
- **Server actions (`+page.server.ts`)** para todo lo que toque DB sensible. El cliente NUNCA manda queries SQL directamente; el servidor valida el `user.id` y aplica la mutación.
- **Service role aislada en `lib/supabase/admin.ts`** que solo se importa desde `.server.ts`. SvelteKit detecta automáticamente y NUNCA lo envía al bundle del cliente.
- **`$env/dynamic/private` para secretos**: la service role va aquí. Si se cuela en client bundle, SvelteKit aborta el build.
- **`set-password` como flujo separado tras invitación**: limpia y reutilizable para "reset password" en futuro.
- **`svelte-dnd-action`** para drag & drop: ligero, touch nativo, integración natural con Svelte 5 runes.
- **Filtros client-side sobre listas en `$derived`**: para listas <500 items es más rápido que ir a la DB con cada keypress. Búsqueda inmediata, sin latencia.

### 6.3 Stack que funcionó bien (Tier 2 — apps con backend)

| Capa | Elección | Cuándo usar |
| --- | --- | --- |
| Frontend | **SvelteKit 2 + Svelte 5** | Apps reactivas con SSR. Sintaxis runes limpia. Bundle pequeño. |
| Estilos | **Tailwind CSS 3 + design tokens** | Productividad alta + paleta consistente. |
| Backend | **Supabase** | Postgres + Auth + Storage + RLS en una cuenta. Free hasta 500 MB. |
| Hosting | **Vercel** | Deploy automático desde GitHub. SvelteKit adapter oficial. |
| Drag & drop | **svelte-dnd-action** | Ligero, touch, Svelte 5 nativo. |
| Email transaccional | Supabase nativo (dev) / Resend (producción) | Free tier de Supabase es ~4/h, insuficiente para escala real. |

### 6.4 Checklist específico apps Tier 2

```
ANTES DE EMPEZAR
[ ] Modelar la base de datos en papel ANTES de tocar UI
[ ] Diseñar las RLS policies en paralelo a las tablas
[ ] Identificar funciones SECURITY DEFINER que evitarán recursión

PRE-DESPLIEGUE A PRODUCCIÓN
[ ] Variables de entorno añadidas en Vercel PROJECT (no Team)
[ ] Las 3 categorías: Production + Preview + Development
[ ] Copy-paste literal desde .env.local, no escribir a mano
[ ] Runtime explícito en svelte.config.js
[ ] Supabase URL Configuration: Site URL + Redirect URLs con tu dominio

POR CADA MIGRATION SQL
[ ] Probarla en SQL Editor de Supabase
[ ] Verificar que las RLS no recursan (testear queries básicas tras aplicar)
[ ] Versionarla en supabase/migrations/NNNN_descripcion.sql
[ ] Actualizar types.ts si la migration cambia el schema

POR CADA NUEVO INPUT DE USUARIO
[ ] Validación client-side + server-side
[ ] Sanitize antes de meter en DB / URLs externas
[ ] Verificar que el server action valida user.id

TRAS CADA DEPLOY
[ ] Confirmar que Production sirve el último commit (no uno antiguo)
[ ] Probar flujo crítico en producción + en local (deben ser idénticos)
[ ] Si añadiste env vars, Redeploy SIN cache
```

### 6.5 Costes operativos reales

| Servicio | Plan | Coste/mes | Cuándo upgrade |
| --- | --- | --- | --- |
| Supabase | Free | 0 € | A los ~50 usuarios activos o si necesitas SMTP propio. Pro 25 $/mes. |
| Vercel | Hobby | 0 € | Cuando facturas servicios. Pro 20 $/mes incluye preview password, analytics, más límites. |
| Cloudinary | Free | 0 € | Hasta 25 GB. Si subes muchos vídeos: Plus 99 $/mes. |
| Dominio | Anual | ~1 €/mes | Compra inicial. |
| **Total inicio** | | **~1 €/mes** | |
| **Total con 50+ clientes** | | **~25-50 €/mes** | |

---

## PARTE 7 · APRENDIZAJES META (proceso de trabajo)

Estos son sobre **cómo trabajar conmigo** (LLM) o con cualquier dev junior+:

1. **Pedir las 3 cosas críticas al principio, no en 4 mensajes diferentes.** Si te pregunto por logs, env vars, deploys y configuración… debería haber pedido las 4 cosas en mi primer mensaje, no ir tirando del hilo. Ahorra muchos saltos.
2. **Una sola fuente de verdad por sesión.** Cuando hay errores en producción, el orden es: ¿está el commit en GitHub? ¿está el deploy verde? ¿está sirviéndose ese commit? ¿están las env vars correctas? Si pregunto en otro orden, perdemos tiempo.
3. **No asumir caché del navegador como respuesta.** Si Ctrl+Shift+R no resuelve, no era caché. Pasar al siguiente diagnóstico.
4. **Los rate limits de free tier importan en desarrollo.** Plan los testeos contra esos límites desde el principio (mock de email, usuarios pre-creados, etc.).
5. **Cada deploy en Vercel sin variables completas es un commit perdido.** Mejor un commit grande con todo listo que 5 commits pequeños fallando en cadena por el mismo motivo.

---

## PARTE 8 · PRINCIPIOS OPERATIVOS AL TRABAJAR CON UN LLM (Can Ficus, jul 2026)

Este bloque nace de un episodio concreto en Can Ficus donde varios ciclos de "está arreglado" resultaron no estarlo. La causa siempre fue la misma: **anunciar sin verificar**. Estos son los principios que aplicarás/exigirás en todos los proyectos futuros.

### 8.1 Verificar antes de anunciar

Si dices "esto está arreglado", "esto funciona" o "el commit está bien", tiene que estar **verificado empíricamente**, no deducido lógicamente. Cada tipo de cambio tiene su check obligatorio:

| Tipo de cambio | Verificación obligatoria antes de anunciar |
|---|---|
| Escritura de archivo | Contar bytes/líneas, buscar NULL bytes y CR spuriosos, sanity check tags (HTML/XML), validador de sintaxis (`node --check`, `python -c`, `yaml.safe_load`) |
| Bug corregido | Reproducir el bug original y confirmar que ya no ocurre |
| Feature nueva | Ejecutar el flujo completo end-to-end o declarar explícitamente qué le toca al usuario probar |
| Push a origen | Confirmar que llegó (`git log origin/main` o CI verde) |
| Integración A ↔ B | Verificar que B **realmente lee** lo que A escribe. No basta con que ambos compilen o "estén bien" por separado |

### 8.2 No dar por hecho lo que no puedo ver

Si afirmas "el botón X está en el toolbar Y", "los cambios ya se ven en la web", "esta librería típicamente hace…" tienes que basarte en:

- Una **screenshot** o log que el usuario me haya pasado explícitamente, o
- Un **grep** o `Read` sobre el código real, o
- Un check en **doc oficial** (con web fetch si hace falta), o
- Decir explícitamente **"creo que…"** y pedir confirmación.

Errores reales cometidos en Can Ficus por saltarme esto:

- Afirmé "el botón Save está arriba a la derecha" sin haberlo visto en el CMS real → resulta que con `publish_mode: simple` la UI es distinta y ese botón estaba tapado por otro elemento mío. Consecuencia: el cliente hacía cambios y creía que los publicaba, pero solo eran drafts locales.
- Afirmé "el commit del CMS actualizó el teléfono en la web" sin verificar que el HTML leyera el JSON → resulta que el HTML jamás hacía `fetch('info.json')`, tenía los datos hardcodeados. El CMS estaba escribiendo en un archivo que nadie leía. Bug latente que llevaba ahí desde el commit inicial del proyecto.
- Escribí `admin/index.html` con `bash heredoc` contra un mount de Windows y anuncié "listo" sin verificar bytes → tenía 452 bytes NULL incrustados que reventaban el parser del navegador. El admin no cargaba.

### 8.3 Regla operativa concreta a partir de ahora

1. **Cada `Write` de archivo termina con verificación**: bytes, tags, sintaxis. No mueves a la siguiente tarea si no pasan.
2. **Cada integración entre dos sistemas termina con un test de extremo a extremo**: el receptor consume la salida del emisor. Si no puedes ejecutarlo tú, describes al usuario exactamente qué probar y esperas confirmación antes de darlo por cerrado.
3. **Cada afirmación sobre UI de terceros va con fuente** (screenshot, grep, doc). Si no la tienes, "creo que…" + petición de confirmación.
4. **Auditar integraciones antes de dar por bueno un flujo**: no basta con arreglar "el sitio que se ve"; hay que revisar si el patrón ("CMS edita → HTML lee") existe en todos los campos afectados o solo en algunos. En Can Ficus el bug del teléfono era la punta del iceberg — había 5 campos más igual de rotos que solo aparecieron al hacer auditoría CMS↔HTML completa.

### 8.4 Anti-patrón detectado: heredoc + Windows mount con archivos grandes

Usar `cat > archivo << 'EOF'` para escribir archivos grandes en un mount de Windows introduce basura (NULL bytes, CRLF residuales, cortes a mitad). **No fiable para >200 líneas**. El patrón robusto es:

```python
python3 << 'PYEOF'
data = '''<html>...</html>'''.encode('utf-8')
assert b'\x00' not in data
assert b'\r' not in data
with open('archivo', 'wb') as f:
    f.write(data)
# Re-leer y comparar byte a byte
with open('archivo', 'rb') as f:
    check = f.read()
assert check == data
PYEOF
```

Verificación byte a byte tras la escritura. Sin excusas.

---

*Fin del documento. Este archivo se actualiza con cada proyecto.*
