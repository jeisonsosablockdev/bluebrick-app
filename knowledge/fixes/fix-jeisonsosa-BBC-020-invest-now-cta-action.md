# Problem Spec: fix-jeisonsosa-BBC-020-invest-now-cta-action

## VERSION ESPAÑOL

### 1. ¿Qué problema existe?
En el Dashboard de Inversiones de BlueBrick (`/dashboard`), el botón principal de llamada a la acción (*CTA*) **"Invertir ahora"** (`ctaButton`) en la tarjeta de oportunidades de reinversión no funciona ni en producción ni en local:
1. **Fallo de Autenticación Rígida en Server Action**: El Server Action `submitInvestmentLeadAction()` intenta forzar `await withAuth()` de WorkOS en cada ejecución. En Next.js, las llamadas POST de Server Actions no propagan el contexto de proxy de igual manera, causando que `withAuth()` arroje `UNAUTHENTICATED` y bloquee el flujo. Como el usuario ya inició sesión y sus datos residen en la **base de datos** (`users`, `dashboard_investors`, `clients`), la acción debe tomar la identidad del usuario conectado en la base de datos en lugar de depender rígidamente de WorkOS.
2. **Destinatario Hardcodeado y no Configurable**: El correo de notificación del lead estaba fijo a `to: "contacto@bluebrick.capital"`. No existía forma de redirigir o configurar el buzón de destino para pruebas o entornos de staging/operación. El buzón receptor debe ser configurable mediante una variable de entorno (`LEAD_NOTIFICATION_EMAIL`), permitiendo que en pruebas se envíe a `jsosa@primalcodelab.com` y se pueda modificar fácilmente en cualquier momento sin tocar código.
3. **Omisión de Datos del Inversionista en el Cliente**: En `investment-dashboard.tsx`, `handleInvestLeadClick` invocaba `submitInvestmentLeadAction` enviando únicamente `{ metadata: { source: "dashboard_reinvestment_cta" } }`, omitiendo pasar los datos del inversionista que el dashboard ya tiene cargados en memoria desde la base de datos (`initialData.investor`).

### 2. ¿Por qué es crítico resolverlo?
- **Operatividad del Botón en Producción y Local**: Permite que cualquier inversionista pueda manifestar su interés de inversión sin bloqueos de sesión.
- **Configurabilidad del Buzón de Notificaciones**: Permite a los administradores y desarrolladores cambiar el buzón de recepción de leads mediante la variable de entorno `LEAD_NOTIFICATION_EMAIL` (por ejemplo, para pruebas inmediatas con `jsosa@primalcodelab.com`).
- **Trazabilidad del Inversionista**: El cuerpo del correo refleja los datos exactos del inversionista conectado desde la base de datos, y el campo `replyTo` permite responderle directamente a su correo personal.

### 3. ¿Qué resultado se espera?
- Al hacer clic en "Invertir ahora", el cliente envía los datos del inversionista conectado en la base de datos (`initialData.investor`).
- El Server Action valida el payload, comprueba la identidad en base de datos (`UserRepository` / `InvestmentRepository`) y aplica el cooldown anti-spam de 60s.
- El correo de notificación se envía al buzón configurado en `LEAD_NOTIFICATION_EMAIL` (con fallback a `contacto@bluebrick.capital`), conteniendo los datos del usuario conectado y `replyTo: validatedLead.investorEmail`.
- Para las pruebas actuales, configurar `LEAD_NOTIFICATION_EMAIL=jsosa@primalcodelab.com` para recibir las notificaciones en dicha casilla.
- El botón muestra feedback reactivo de éxito y error con spinner y mensaje accesible.

### 4. Brechas identificadas en el codebase actual
- `apps/web/src/lib/auth/investment-actions.ts`: Acoplamiento rígido a `withAuth()` y destinatario `to: "contacto@bluebrick.capital"` hardcodeado.
- `apps/web/src/components/dashboard/investment-dashboard.tsx`: No envía los atributos de `initialData.investor`.
- Archivos `.env.example` y `.env.local`: Falta declarar la variable de entorno `LEAD_NOTIFICATION_EMAIL`.

### 5. Preguntas abiertas / Decisiones de diseño
- **Variable de Configuración**: `LEAD_NOTIFICATION_EMAIL` definirá el destinatario (`to:`), permitiendo cambiarlo dinámicamente según el entorno.
- **Datos del Lead**: El remitente e información del inversionista se toman del usuario conectado cargado desde la base de datos.

---

## ENGLISH VERSION

### 1. What problem exists?
On the BlueBrick Investment Dashboard (`/dashboard`), the primary call to action (*CTA*) button **"Invest Now"** (`ctaButton`) fails in both production and local environments:
1. **Rigid WorkOS Authentication in Server Action**: `submitInvestmentLeadAction()` rigidly invokes `await withAuth()` on each dispatch. Server Action POST requests in Next.js do not always preserve proxy header contexts, triggering `UNAUTHENTICATED`. Since the user is already logged in and their data resides in the **database** (`users`, `dashboard_investors`, `clients`), the action must use the connected user's database identity.
2. **Hardcoded Non-Configurable Recipient**: The lead notification destination was hardcoded to `to: "contacto@bluebrick.capital"`. There was no mechanism to redirect lead notifications for staging or developer testing. The recipient inbox must be configurable via an environment variable (`LEAD_NOTIFICATION_EMAIL`), allowing direct routing to `jsosa@primalcodelab.com` during testing.
3. **Missing Client Investor Payload**: In `investment-dashboard.tsx`, `handleInvestLeadClick` called `submitInvestmentLeadAction` without forwarding the database investor metadata from `initialData.investor`.

### 2. Why does it matter?
- **Production Conversion**: Restores reinvestment lead capture across all environments.
- **Configurable Notification Routing**: Allows teams to easily change the destination inbox via `LEAD_NOTIFICATION_EMAIL` without code changes.
- **Investor Traceability**: The notification email body accurately portrays the connected database user, with `replyTo` pointing to the investor's personal email.

### 3. What outcome is expected?
- Clicking "Invest Now" sends the connected user's database metadata (`initialData.investor`).
- Server Action validates the payload and verifies identity against the database without failing on WorkOS server-action checks.
- Notification email is delivered to `process.env.LEAD_NOTIFICATION_EMAIL || "contacto@bluebrick.capital"`, containing the investor's details and `replyTo: validatedLead.investorEmail`.
- Setting `LEAD_NOTIFICATION_EMAIL=jsosa@primalcodelab.com` sends testing leads directly to the developer's mailbox.
- Responsive feedback with spinner and accessible confirmation banner.

### 4. Gaps identified
- `investment-actions.ts`: Hardcoded recipient and rigid `withAuth()` dependency.
- `investment-dashboard.tsx`: Missing investor attributes in action call.
- Environment templates lacking `LEAD_NOTIFICATION_EMAIL`.

### 5. Open questions & Design decisions
- Recipient email is driven by `process.env.LEAD_NOTIFICATION_EMAIL`.
- Lead investor details are populated from the connected database user.
