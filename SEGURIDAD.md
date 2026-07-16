# 🔐 Informe de seguridad y privacidad — Raíz Granola

Revisión tipo pentest (caja blanca, revisión de código) del proyecto, con el
hardening aplicado y las recomendaciones pendientes. Fecha: 16 de julio de 2026.

> Alcance: autenticación, sesiones, panel admin, pagos, cabeceras, y cumplimiento
> RGPD/LOPD (cookies y páginas legales). No incluye pentest dinámico contra la URL
> en producción (requiere autorización y entorno estable).

---

## 1. Resumen

| Área | Antes | Ahora |
| --- | --- | --- |
| Sesiones | 30 días fijos, sin invalidación | 7 días (configurable), se invalidan al cambiar contraseña |
| Fuerza bruta | Sin límite de intentos | Rate limiting en DB (login, registro, forgot, resend) |
| Enumeración de usuarios por timing | Login más rápido si el email no existía | Se gasta el mismo tiempo (hash señuelo) |
| Cabeceras | Básicas | + Content-Security-Policy (producción) |
| JS inline | `onsubmit` inline en admin | Movido a script externo (CSP-friendly) |
| Cookies / legal | Nada | Banner + Privacidad, Cookies, Aviso legal, Términos |

---

## 2. Hallazgos y estado

### Corregidos en esta revisión

1. **Sesión demasiado larga / sin revocación.** Reducida a 7 días (variable `SESSION_DAYS`).
   Al cambiar la contraseña se borran TODAS las sesiones del usuario (`updatePassword`).
2. **Sin protección anti fuerza-bruta.** Nuevo `src/lib/ratelimit.ts` (tabla `rate_limits`):
   login 5/15 min por IP+email, registro 5/h por IP, forgot 3/h, resend 3/h.
3. **Fuga por timing en login.** Si el email no existía, no se ejecutaba el hash y la
   respuesta era más rápida (revelaba qué emails existen). Ahora `burnPasswordTime()` iguala el tiempo.
4. **Falta de CSP.** Añadida en `middleware.ts` (solo en producción, para no romper el HMR).
5. **JS inline (`onsubmit`).** Sustituido por un listener externo → permite CSP sin `unsafe-inline` en scripts.
6. **robots.txt 404.** Añadido `src/pages/robots.txt.ts` (bloquea /admin, /cuenta, /api).

### Ya estaban bien (verificado)

- Contraseñas con **scrypt** + `timingSafeEqual`. Nunca en claro.
- **SQL 100% parametrizado** (sin inyección).
- **XSS**: Astro escapa por defecto; JSON-LD serializado de datos controlados.
- **Precios recalculados en el servidor** en el checkout (no se puede manipular el importe).
- **Webhook de Stripe con firma verificada.**
- Cookies de sesión **httpOnly + secure (prod) + SameSite=Lax**.
- **Open redirect** en `?next=` bloqueado (solo rutas internas).
- Admin exige **email verificado** (cierra el registro del email admin por un tercero).
- Endpoints sensibles solo **POST**; honeypot anti-bot en formularios.

### Recomendaciones pendientes (no bloqueantes)

| # | Tema | Prioridad | Nota |
| --- | --- | --- | --- |
| R1 | ~~Autoalojar Google Fonts~~ ✅ HECHO | — | Fuentes servidas localmente vía Fontsource (`@fontsource/*`). Ya no se llama a Google. |
| R2 | **Rellenar datos legales** | Alta | Las páginas legales tienen marcadores `[NOMBRE]`, `[NIF]`, `[DIRECCIÓN]`, `[EMAIL]`. Sin ellos no son válidas. |
| R3 | Token de Turso de **solo escritura mínima** | Media | El token debe ser read-write (ya diagnosticado). Rótalo periódicamente. |
| R4 | ~~Borrado de cuenta / exportación de datos~~ ✅ HECHO | — | Botones en /cuenta: descargar datos (JSON) y eliminar cuenta. |
| R5 | ~~Cabecera `__Host-` en la cookie~~ ✅ HECHO | — | La cookie usa prefijo `__Host-` en producción. |
| R6 | 2FA para administradores | Baja | Si el panel gestiona datos sensibles a futuro. |
| R7 | Verificar la CSP en producción | Media | Al no poder ejecutar el build aquí, revisa la consola tras desplegar por si algún recurso queda bloqueado. |

---

## 3. Checklist RGPD / LOPD

```
[x] Política de Privacidad (/privacidad)
[x] Política de Cookies (/cookies)
[x] Aviso Legal — LSSI (/aviso-legal)
[x] Términos y Condiciones de venta (/terminos)
[x] Banner de cookies informativo
[x] Enlaces legales en el footer
[x] Solo cookies necesarias (sin analítica/publicidad)
[x] Contraseñas cifradas, HTTPS, cabeceras de seguridad
[~] Datos del responsable rellenados con PLACEHOLDER (Raíz Granola S.L., B00000000…) — sustituir por los reales
[x] Fuentes autoalojadas (Fontsource) — sin llamadas a Google
[ ] Contrato de encargado de tratamiento con proveedores (Stripe, Turso, Vercel, Resend)
[ ] Registro de actividades de tratamiento (si aplica por volumen)
[x] Opción de borrado de cuenta y exportación de datos
```

---

## 4. Variables de entorno relevantes para seguridad

```
SESSION_SECRET     — cadena larga aleatoria (rotar si se filtra)
SESSION_DAYS       — duración de sesión en días (por defecto 7)
DATABASE_AUTH_TOKEN— token Turso READ-WRITE
ADMIN_EMAILS       — lista de administradores (verificados)
```

---

*Este informe refleja la revisión de código. Tras desplegar, conviene pasar la web por
`securityheaders.com` y `observatory.mozilla.org` y revisar la consola del navegador.*
