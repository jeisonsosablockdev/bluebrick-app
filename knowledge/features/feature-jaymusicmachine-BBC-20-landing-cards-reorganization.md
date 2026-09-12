# Problem Spec: landing-cards-reorganization

## What problem exists
La interfaz gráfica de inicio (Landing Page) de BlueBrick presentaba actualmente la propuesta de valor institucional en un bloque de texto denso y corrido ("Accede a tu portafolio institucional, monitorea distribuciones mensuales, consulta el rendimiento ponderado y reinvierte capital en oportunidades exclusivas"), acompañado por un badge de seguridad aislado y una card de autenticación pesada que mezclaba títulos de acceso exclusivo con la acción de login por correo.

Esta disposición generaba sobrecarga visual y dificultaba que el inversionista identifique de inmediato los 4 pilares clave de la plataforma privada:
1. Acceso Exclusivo y Gestión de Inversiones.
2. Consulta de Rendimiento y Rentabilidad.
3. Monitoreo de Distribuciones Mensuales.
4. Reinversión de Capital en Nuevas Oportunidades.

Además, en la card de acceso figuraba un proveedor de autenticación obsoleto/no prioritario (Yahoo) que requería ser removido para mantener una experiencia limpia y enfocada en proveedores institucionales (Google, Microsoft, Apple).

## Why it matters
La Landing Page es el primer punto de contacto de inversionistas institucionales y calificados con la plataforma BlueBrick. Una presentación estructurada en tarjetas visuales (cards) con microanimaciones elegantes:
- Clarifica de manera inmediata las capacidades de la plataforma.
- Aumenta el engagement visual y la confianza en la marca.
- Facilita la navegación responsiva tanto en dispositivos móviles (iPhone/Android) como en pantallas de escritorio.
- Mantiene la coherencia con el diseño de lujo (paleta institucional azul profundo #0A1220, detalles en esmeralda institucional #57B98C y gradiente carmesí #C41230 - #E8495F).

## What outcome is expected
1. Encabezado Institucional Refinado:
   - Logotipo oficial BlueBrickLogo con subtítulo centrado "plataforma de inversión".
   - Saludo prominente: "Hola, Inversionista".
   - Subtítulo limpio: "Accede a tu portafolio...".
2. Grid 2x2 de Cards Informativas:
   - Card 1: Icono de ladrillos/bloques, badge verde institucional "Portal Privado", título "Acceso Exclusivo" y subtítulo "Gestione sus inversiones".
   - Card 2: Icono de gráfico/tendencia, título "Consultar Rendimiento".
   - Card 3: Icono de mano con monedas, título "Monitorear Distribuciones".
   - Card 4: Icono de apretón de manos, título "Reinvertir Capital".
   - Microanimaciones sutiles (hover lift, glow suave, transición fluida de bordes y fondos) para atraer la interacción sin resultar invasivas.
   - Naturaleza puramente informativa (visual value cards).
3. Card de Autenticación Optimizada:
   - Botón CTA principal: "Ingresa con tu correo" con icono de flecha y gradiente rojo institucional hacia /auth/login.
   - Compatibilidad de proveedores depurada: Google, Microsoft y Apple (Yahoo eliminado).
   - Pie de seguridad institucional y privacidad.
4. Soporte Multilenguaje Completo:
   - Integración nativa en los diccionarios es, en y pt.
   - Soporte total a temas claro y oscuro (useTheme).
5. Calidad y Cobertura de Pruebas:
   - 100% de tests unitarios y validaciones de arquitectura en verde (pnpm validate).

## What gaps exist today
- Falta el componente de presentación landing-feature-cards.tsx para el grid 2x2.
- El componente landing-hero.tsx posee tipografía y jerarquía anterior que debe alinearse al nuevo flujo.
- El componente investor-login-card.tsx incluye el chip de Yahoo y encabezados que ahora se trasladan a la Card 1 del grid.
- Los esquemas y diccionarios de internacionalización carecen de las claves de traducción para las 4 cards y los nuevos titulares.

## What questions remain open
- Ninguna pregunta abierta: El usuario confirmó que las cards deben ser informativas, Yahoo debe ser removido, el handle es jaymusicmachine y el issue de Linear es BBC-20.
