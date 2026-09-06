# Problem Spec: fix-jeisonsosa-BBC-020-invest-now-cta-action

## VERSION ESPAÑOL

### 1. ¿Qué problema existe?
En el Dashboard de Inversiones de BlueBrick (`/dashboard`), el botón principal de llamada a la acción (*CTA*) **"Invertir ahora"** (`ctaButton`) en la tarjeta de oportunidades de reinversión presenta fallos operativos críticos al interactuar con él:
1. **Fallo de Autenticación Rígida**: El Server Action `submitInvestmentLeadAction()` exige rígidamente una sesión activa de WorkOS (`if (!auth?.user || !investor?.id)`). En entornos de pruebas locales o cuando se accede mediante modo demo o parámetros de correo (`/dashboard?email=jsosa@primalcodelab.com`), la verificación rechaza la petición con el error `"No se encuentra autenticado."`, imposibilitando la prueba del flujo de inversión.
2. **Destinatario Desconectado del Usuario**: El correo de notificación de la solicitud de inversión estaba hardcodeado para enviarse exclusivamente a `to: "contacto@bluebrick.capital"`. Esto genera una inconsistencia funcional severa: quien está conectado (por ejemplo `jsosa@primalcodelab.com`) no recibe la confirmación ni puede validar el resultado de su solicitud, careciendo de sentido para la experiencia del usuario y para las pruebas end-to-end.
3. **Desconexión de Metadatos del Inversionista en Cliente**: El componente cliente `investment-dashboard.tsx` invoca el Server Action sin transferir los datos del inversionista resuelto en el contexto del dashboard (`initialData.investor`), perdiendo la trazabilidad del usuario real que realiza el clic si la cookie de sesión no está sincronizada.

### 2. ¿Por qué es crítico resolverlo?
- **Conversión y Negocio**: El botón "Invertir ahora" es la principal vía de captura de intención de inversión y reinversión dentro de la plataforma. Si el botón no responde o arroja errores de autenticación, la plataforma no puede captar leads ni ejecutar el flujo comercial.
- **Validación del Usuario Conectado**: El inversionista conectado necesita recibir la confirmación de recepción en su propia bandeja de entrada para verificar que la plataforma registró su intención.
- **Entorno de Testing Confiable**: Permite realizar pruebas operativas inmediatas utilizando la identidad conectada (e.g. `jsosa@primalcodelab.com`) tanto en modo real como en fallback resiliente.

### 3. ¿Qué resultado se espera?
- Al hacer clic en "Invertir ahora", el Server Action procesa la solicitud tomando los datos del inversionista conectado en el dashboard.
- El correo de notificación se envía teniendo como destinatario principal (`to:`) el correo del usuario conectado (`jsosa@primalcodelab.com` durante las pruebas).
- Se permite opcionalmente enviar copia (CC o BCC) a la dirección corporativa (`contacto@bluebrick.capital`), pero el destinatario principal debe ser el inversionista conectado.
- Si el usuario está navegando en el dashboard con su cuenta o perfil resuelto, el Server Action acepta la identidad validada por Zod y despacha el correo sin bloquearse por ausencia de cookie WorkOS en modo local/demo.
- El botón muestra feedback reactivo de éxito claro en la interfaz (spinner durante envío, mensaje de confirmación accesible tras el despacho).

### 4. Brechas identificadas en el codebase actual
- `apps/web/src/lib/auth/investment-actions.ts`: Validación acoplada exclusivamente a `auth.user` de WorkOS sin soporte para identidad resuelta en `getAuthenticatedInvestor()` o payload validado del cliente. Hardcode de destinatario `to: "contacto@bluebrick.capital"`.
- `apps/web/src/components/dashboard/investment-dashboard.tsx`: `handleInvestLeadClick` solo envía `{ metadata: { source: "dashboard_reinvestment_cta" } }` sin incluir los atributos de `initialData.investor`.
- `tests/unit/investment-lead-behavioral.test.ts` y `tests/unit/investment-dashboard-cta.test.tsx`: Aserciones configuradas con el destinatario anterior que deben actualizarse al nuevo contrato del destinatario conectado.

### 5. Preguntas abiertas / Decisiones de diseño
- **Destinatario primario vs Copia**: El destinatario primario (`to`) es el correo del inversionista conectado (`validatedLead.investorEmail`). La dirección de soporte (`contacto@bluebrick.capital`) puede recibir copia de respaldo (`cc` o configurable vía variable de entorno `LEAD_NOTIFICATION_COPY_EMAIL`).

---

## ENGLISH VERSION

### 1. What problem exists?
On the BlueBrick Investment Dashboard (`/dashboard`), the primary call to action (*CTA*) button **"Invest Now"** (`ctaButton`) inside the reinvestment opportunities card exhibits critical operational failures:
1. **Rigid Authentication Guard**: The Server Action `submitInvestmentLeadAction()` strictly requires an active WorkOS session (`if (!auth?.user || !investor?.id)`). In local testing or when accessing via demo/query parameter modes (`/dashboard?email=jsosa@primalcodelab.com`), it aborts with `"No se encuentra autenticado."`, preventing lead testing.
2. **Recipient Disconnected from Connected User**: The notification email was hardcoded to send exclusively to `to: "contacto@bluebrick.capital"`. This creates a severe functional gap: the connected investor (e.g. `jsosa@primalcodelab.com`) does not receive the confirmation, making the action senseless from an investor experience and verification standpoint.
3. **Missing Client-Side Investor Metadata**: `investment-dashboard.tsx` dispatches the server action without sending the investor data resolved on the dashboard (`initialData.investor`), losing identity context if the session cookie is not synced.

### 2. Why does it matter?
- **Conversion & Business**: "Invest Now" is the key conversion engine for reinvestment. Unresponsive buttons or unauthenticated rejections break the investor acquisition funnel.
- **Connected User Confirmation**: Connected investors must receive direct email confirmations in their inbox.
- **Reliable Testing Workflow**: Enables immediate verification using the connected developer/investor email (`jsosa@primalcodelab.com`).

### 3. What outcome is expected?
- Clicking "Invest Now" processes the request using the connected investor's metadata.
- The outbound notification email uses the connected investor's email as the primary recipient (`to:` `jsosa@primalcodelab.com`).
- Corporate support (`contacto@bluebrick.capital`) may receive a copy (CC/BCC), but the primary recipient is the connected user.
- Server Action accepts validated identity through Layer 3 Zod schema even when in dev/demo resolution.
- UI displays clear reactive feedback (loading spinner, accessible success banner).

### 4. Gaps identified
- `investment-actions.ts`: Hardcoded `to: "contacto@bluebrick.capital"` and rigid `auth?.user` check.
- `investment-dashboard.tsx`: Missing payload properties in `submitInvestmentLeadAction` call.
- Unit test suites reflecting old recipient expectations.

### 5. Open questions & Design decisions
- Primary recipient is `validatedLead.investorEmail` (the connected user). Corporate lead inbox receives copy via CC or env fallback.
