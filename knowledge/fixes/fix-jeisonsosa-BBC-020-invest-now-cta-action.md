# Problem Spec: fix-jeisonsosa-BBC-020-invest-now-cta-action

## VERSION ESPAÑOL

### 1. ¿Qué problema existe?
En el Dashboard de Inversiones de BlueBrick (`/dashboard`), el botón principal de llamada a la acción (*CTA*) **"Invertir ahora"** (`ctaButton`) en la tarjeta de oportunidades de reinversión no funciona tanto en **producción** como en **local**:
1. **Confusión de Responsabilidades (WorkOS vs Base de Datos)**: WorkOS tiene como único rol la autenticación inicial del usuario. Una vez que el usuario inicia sesión y accede al dashboard, su identidad y datos correspondientes ya residen y se consultan en la **base de datos** (`users`, `dashboard_investors`, `clients`). Sin embargo, el Server Action `submitInvestmentLeadAction()` intentaba re-validar la sesión llamando a `withAuth()` de WorkOS en cada ejecución, fallando tanto en producción (donde la cabecera del proxy no siempre está presente en la llamada POST de Server Actions) como en local, arrojando `"No se encuentra autenticado."`.
2. **Destinatario Incorrecto**: El correo de notificación estaba configurado con destinatario fijo a `to: "contacto@bluebrick.capital"`. No tiene sentido que el inversionista conectado no reciba la confirmación en su propio correo. El destinatario debe ser obligatoriamente la persona que está conectada en la cuenta (`investor.email`), permitiendo a usuarios reales y a pruebas (como `jsosa@primalcodelab.com`) recibir el correo de confirmación de su solicitud de inversión.
3. **Omisión de Datos del Inversionista en el Cliente**: En `investment-dashboard.tsx`, `handleInvestLeadClick` ejecutaba `submitInvestmentLeadAction` enviando únicamente un objeto con `metadata: { source: "dashboard_reinvestment_cta" }`, omitiendo pasar los datos del inversionista que el dashboard ya tiene cargados en memoria desde la base de datos (`initialData.investor`).

### 2. ¿Por qué es crítico resolverlo?
- **Fallo en Producción y Local**: Al fallar en producción, ningún inversionista real puede enviar leads ni solicitar reinversiones desde el dashboard.
- **Uso de la Fuente de Verdad Adecuada**: La plataforma debe utilizar los datos del usuario cargados desde la base de datos para la operativa del negocio, dejando a WorkOS exclusivamente como mecanismo de autenticación de entrada.
- **Trazabilidad y Experiencia de Usuario**: Quien hace clic en "Invertir ahora" debe ser quien recibe la confirmación formal de recepción en su correo electrónico.

### 3. ¿Qué resultado se espera?
- Al hacer clic en "Invertir ahora", la acción toma los datos del usuario conectado que ya están en la base de datos y en el dashboard (`initialData.investor`).
- El Server Action valida el payload mediante Zod (`investmentLeadSchema`), verifica al usuario en la base de datos (`UserRepository` / sesión activa) y despacha el correo sin depender rígidamente de `withAuth()` en la Server Action.
- El destinatario del correo (`to:`) es el correo del usuario conectado (`validatedLead.investorEmail`, e.g. `jsosa@primalcodelab.com`).
- Se emite copia institucional opcional a `contacto@bluebrick.capital` o `LEAD_NOTIFICATION_COPY_EMAIL`.
- El botón muestra feedback reactivo de éxito claro con su spinner de envío y mensaje de confirmación accesible.

### 4. Brechas identificadas en el codebase actual
- `apps/web/src/lib/auth/investment-actions.ts`: Acoplado a `withAuth()` en lugar de utilizar la identidad resuelta de la base de datos. Destinatario hardcodeado a `contacto@bluebrick.capital`.
- `apps/web/src/components/dashboard/investment-dashboard.tsx`: `handleInvestLeadClick` no envía los campos de `initialData.investor`.
- `apps/web/src/lib/infrastructure/db/repositories/user-repository.ts`: Soporte para búsqueda y validación por email (`findByEmail`).

### 5. Preguntas abiertas / Decisiones de diseño
- El destinatario principal (`to:`) es el email del usuario conectado proveniente de la base de datos / dashboard.
- Se mantiene el cooldown anti-spam de 60 segundos por usuario.

---

## ENGLISH VERSION

### 1. What problem exists?
On the BlueBrick Investment Dashboard (`/dashboard`), the primary call to action (*CTA*) button **"Invest Now"** (`ctaButton`) inside the reinvestment opportunities card fails in both **production** and **local** environments:
1. **Misalignment of Responsibilities (WorkOS vs Database)**: WorkOS is exclusively meant for initial user authentication. Once the user is logged in, their profile and holdings are loaded from the **database** (`users`, `dashboard_investors`, `clients`). However, `submitInvestmentLeadAction()` attempted to re-verify session headers via `withAuth()` on every server action call. In production, Next.js Server Action POST requests lack proxy header context, triggering `"No se encuentra autenticado."`.
2. **Incorrect Recipient**: The outbound email was hardcoded to `to: "contacto@bluebrick.capital"`. The connected user who is investing never received the notification. The recipient must be whoever is connected in the account (`investor.email`), enabling real investors and testers (such as `jsosa@primalcodelab.com`) to receive direct email confirmation.
3. **Omission of Investor Payload on Client**: In `investment-dashboard.tsx`, `handleInvestLeadClick` triggered `submitInvestmentLeadAction` without including the database-backed investor profile available in `initialData.investor`.

### 2. Why does it matter?
- **Production Outage**: The core conversion button for reinvestment is broken in production.
- **Correct Source of Truth**: Business operations must consume user identity from the database, treating WorkOS strictly as an authentication gateway.
- **User Experience**: The connected investor must receive direct confirmation in their own mailbox.

### 3. What outcome is expected?
- Clicking "Invest Now" sends the connected user's database profile to the server action.
- The Server Action validates the payload with Zod, checks against the database (`UserRepository` / active session), and sends the email without failing on WorkOS server-action checks.
- Email recipient (`to:`) is the connected user (`validatedLead.investorEmail`, e.g. `jsosa@primalcodelab.com`).
- Optional copy sent to corporate lead inbox.
- Reactive UI displays spinner and accessible confirmation feedback.

### 4. Gaps identified
- `investment-actions.ts`: Fragile `withAuth()` guard replaced with database-backed investor verification.
- `investment-dashboard.tsx`: Forwarding `initialData.investor` metadata.
- `user-repository.ts`: Adding `findByEmail` helper for robust email resolution.

### 5. Open questions & Design decisions
- Primary recipient is the connected user's email from the database.
- 60-second anti-spam cooldown per investor remains active.
