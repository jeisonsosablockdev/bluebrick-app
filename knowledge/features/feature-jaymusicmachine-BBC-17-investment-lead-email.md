# Problem Spec: investment-lead-email (BBC-17)

## What problem exists
En el Dashboard del inversionista de BlueBrick, la sección de oportunidades de reinversión ("Haz crecer tu patrimonio") cuenta con un botón principal de llamada a la acción (*CTA*): **"Invertir ahora"** (`ctaButton`). 
Actualmente, este botón es puramente visual y no ejecuta ninguna acción al ser presionado (`onClick` inexistente), lo que genera una experiencia de usuario truncada e impide la captura activa de intenciones de inversión o reinversión por parte de los inversionistas registrados.

## Why it matters
1. **Conversión y Generación de Leads de Inversión**: Los inversionistas que exploran el dashboard y desean ampliar su portafolio necesitan un canal directo e inmediato para manifestar su interés en reinvertir en los proyectos activos.
2. **Atención Personalizada de Alto Nivel**: Al notificar directamente a `contacto@bluebrick.capital` con los datos del usuario autenticado (nombre, correo registrado, tier de inversionista y fecha de la solicitud), el equipo comercial y de inversiones de BlueBrick puede contactar al inversionista de forma proactiva y personalizada.
3. **Independencia Tecnológica**: Al implementar la solución a través de un Server Action de Next.js conectado a un servidor SMTP corporativo propio (`nodemailer`), BlueBrick mantiene el control total de sus comunicaciones transaccionales sin depender de pasarelas SaaS de terceros ni incurrir en costos recurrentes innecesarios.

## What outcome is expected
1. **Acción en 1 Clic con Server Action**:
   - Al hacer clic en "Invertir ahora", se dispara un Server Action seguro en Next.js.
   - La acción valida la sesión del usuario (vía WorkOS AuthKit) para garantizar autenticidad.
   - Se compila un correo con formato corporativo institucional conteniendo los datos completos del inversionista solicitante.
   - El correo se envía de manera asíncrona hacia `contacto@bluebrick.capital`.
2. **Feedback Visual en Tiempo Real (UX)**:
   - El botón refleja estados claros: estado interactivo normal, estado de carga (*loading spinner*) y estado de confirmación/éxito (*toast* o feedback en pantalla informando que el equipo se pondrá en contacto).
   - Prevención de envíos duplicados / spam (deshabilitación durante el envío y control de cooldown).
3. **Robustez y Modo de Desarrollo (Dry-run / Fallback)**:
   - Si las variables de entorno SMTP no están configuradas en un entorno de desarrollo local o testing, el sistema registra el envío en logs estructurados sin provocar caídas de la aplicación ni bloquear la experiencia del usuario.

## What gaps exist today
- El botón en `apps/web/src/components/dashboard/investment-dashboard.tsx` carece de manejador de eventos `onClick` y de gestión de estados de envío/feedback.
- No existe un Server Action para la captura y notificación de leads de inversión.
- No existe un servicio de infraestructura para envío de correos vía SMTP en el monorepo (`lib/infrastructure/email`).
- No están instaladas las dependencias de transporte de correo estándar (`nodemailer` / `@types/nodemailer`).
- No existen las variables de entorno documentadas para SMTP en `.env.example`.

## What questions remain open
- Ninguna. La dirección técnica está acordada: Camino 2 (Server Action de Next.js + SMTP estándar corporativo hacia `contacto@bluebrick.capital` con flujo de 1 clic y feedback en el dashboard).
