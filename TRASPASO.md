# 📦 Traspaso — Raíz Granola

Documento para rellenar **el día de la entrega**, con el cliente delante.
(Plantilla basada en el playbook de lecciones aprendidas.)

---

## 1. Datos del proyecto

- **Nombre del proyecto:** Raíz Granola
- **URL de producción:** ____________________________
- **Repositorio:** ____________________________
- **Fecha de entrega:** ____________________________
- **Modelo de relación acordado (A / B / C):** ______

## 2. Cuentas (propiedad del cliente, con su email + 2FA)

| Servicio | Email de la cuenta | 2FA activado | Notas |
| --- | --- | --- | --- |
| Hosting (Railway/Render/Vercel…) | ____________ | ☐ | |
| Stripe | ____________ | ☐ | Claves LIVE configuradas en el hosting |
| Base de datos (Turso) | ____________ | ☐ | `DATABASE_URL` + token |
| GitHub | ____________ | ☐ | |
| Dominio (registrar) | ____________ | ☐ | Renovación anual: fecha ______ |

## 3. Variables de entorno en producción (verificar que están TODAS)

```
[ ] DATABASE_URL           (Turso, no el archivo local)
[ ] DATABASE_AUTH_TOKEN
[ ] SESSION_SECRET         (cadena larga y aleatoria, distinta de la de dev)
[ ] STRIPE_SECRET_KEY      (sk_live_...)
[ ] STRIPE_PUBLISHABLE_KEY (pk_live_...)
[ ] STRIPE_WEBHOOK_SECRET  (whsec_... del endpoint de producción)
[ ] PUBLIC_SITE_URL        (https://tudominio.com)
```

> Recordatorio (lección 6.1): copia-pega las claves, no las escribas a mano.
> Tras añadirlas, **redeploy** para que el build las tome.

## 4. Verificación en vivo con el cliente

- [ ] El cliente entra a su cuenta de Stripe y ve el dashboard.
- [ ] Se hace un **pedido real de prueba** (o en test) de principio a fin.
- [ ] El pedido aparece en `/cuenta` como "Pagado".
- [ ] El cliente edita un producto en `src/lib/products.ts` (o donde se gestione el catálogo) y ve el cambio tras un deploy.
- [ ] El webhook de Stripe recibe eventos (probar con un pago real pequeño o Stripe CLI).

## 5. Qué incluye la entrega

- Código fuente completo y documentado (`README.md`).
- Tienda funcional: catálogo, carrito, cuentas de usuario, pagos con Stripe.
- Cabeceras de seguridad y validación/sanitización de formularios.

## 6. Qué NO incluye

- Fotografía profesional de producto (ahora hay ilustraciones/gradientes).
- Diseño de logo profesional.
- Gestión de inventario/stock en tiempo real.
- Emails transaccionales personalizados (Stripe envía el recibo básico).
- Integración contable/facturación fiscal.

## 7. Disclaimer (leer y firmar)

> Esta web se entrega en estado funcional, sin compromiso de mantenimiento
> continuado por parte del desarrollador. El cliente acepta que cualquier
> modificación posterior (añadir secciones, corregir bugs, actualizar
> dependencias, migrar tecnologías) requiere contratar a un desarrollador
> profesional. Las cuentas de hosting, Stripe, base de datos, GitHub y
> registrar de dominio son propiedad del cliente. La continuidad del servicio
> depende de que el cliente renueve el dominio anualmente, mantenga sus cuentas
> activas y sus claves de Stripe válidas. El cliente declara haber recibido la
> guía de uso y haber realizado al menos una operación de prueba (un pedido
> completo) en el entorno entregado.

Firmado (cliente): ______________________  Fecha: ____________

Firmado (desarrollador): _________________  Fecha: ____________
