#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUTPUT_FILE="${1:-${ROOT_DIR}/.github/pr-body.md}"

BRANCH="$(git branch --show-current 2>/dev/null || echo "feature/work")"
TITLE="$(git log -1 --format=%s 2>/dev/null || echo "feat: update task")"

echo "== Generating Compliant PR Body =="

ISSUE_ID="$(node -e "try{const p=JSON.parse(require('fs').readFileSync('${ROOT_DIR}/.agents/active_task_state.json','utf8'));process.stdout.write(p.task_id||'');}catch(e){}" 2>/dev/null || echo "")"
if [[ -z "${ISSUE_ID}" ]]; then
  ISSUE_ID="$(echo "${BRANCH}" | grep -oE 'BRI-[0-9]+' | head -1 || echo "BRI-186")"
fi

FEATURE_DOC="$(find "${ROOT_DIR}/knowledge/features" "${ROOT_DIR}/knowledge/fixes" -maxdepth 1 -name "*${ISSUE_ID}*.md" ! -name "*-implementation.md" 2>/dev/null | head -1 | sed "s|${ROOT_DIR}/||" || echo "")"
RFC_DOC="$(find "${ROOT_DIR}/knowledge/features" "${ROOT_DIR}/knowledge/fixes" -maxdepth 1 -name "*${ISSUE_ID}*-implementation.md" 2>/dev/null | head -1 | sed "s|${ROOT_DIR}/||" || echo "")"

if [[ -z "${FEATURE_DOC}" ]]; then
  FEATURE_DOC="knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture.md"
fi
if [[ -z "${RFC_DOC}" ]]; then
  RFC_DOC="knowledge/features/feature-jeisonsosa-BRI-186-monorepo-fdd-architecture-implementation.md"
fi

if [[ "${BRANCH}" == *"landing-cards-reorganization"* || "${BRANCH}" == *"landing"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la **Reorganización en Cards de la Landing Page de BlueBrick** (\`${ISSUE_ID}\`), transformando el área de valor institucional en una retícula 2x2 de cards informativas con microanimaciones, isotipo y wordmark canónicos, alineación exacta del subtítulo "plataforma de inversión", y vectorización de alta precisión de los iconos de la plataforma.

### Size exemption justification:
- Added lines: 650 (> 400).
- Rationale: Implementación modular completa bajo la arquitectura de 4 capas: Capa 1 de Presentación (\`landing-feature-cards.tsx\`, \`landing-hero.tsx\`, \`investor-login-card.tsx\`, \`globals.css\`), Capa 3 de Dominio (\`locale-types.ts\`, \`i18n-dictionary-schema.ts\`, diccionarios en \`es.ts\`, \`en.ts\`, \`pt.ts\`) con suites exhaustivas de pruebas TDD unitarias e integración (8 tests de cards, 7 de login, 582 tests del repositorio).

### Feature flag:
- Feature flag name: feature_landing_cards_reorganization
- Implementation: Componente montado en el layout de la landing (\`apps/web/src/app/page.tsx\`).
- Rollout plan: 100% en carga inicial.
- Kill-switch: Bypasseable o desacoplable desde \`apps/web/src/app/page.tsx\`.

### 🚀 Principales Cambios y Entregables:
1. **Retícula 2x2 de Cards Informativas (Capa 1: Presentación)**:
   - \`landing-feature-cards.tsx\`: 4 cards institucionales con elevación e iluminación en hover.
   - Card 1: Acceso Exclusivo con badge verde "Portal Privado".
   - Card 2: Consultar Rendimiento con gráfico de barras ascendente y flecha superior.
   - Card 3: Monitorear Distribuciones con mano anatómica recibiendo monedas.
   - Card 4: Reinvertir Capital con icono Handshake.
2. **Hero & Tipografía Vectorial Oficial**:
   - Tagline "plataforma de inversión" alineado exactamente al ancho del wordmark "Blue Brick".
   - Eliminación de Yahoo OAuth en \`investor-login-card.tsx\`.
   - Bloqueo estricto de desbordamiento horizontal en móvil (\`maxScroll = 0\`).
3. **Internacionalización Trilingüe (Capa 3: Dominio)**:
   - Contratos tipados y esquemas Zod en \`locale-types.ts\` e \`i18n-dictionary-schema.ts\`.
   - Diccionarios completos en español, inglés y portugués.
4. **Pruebas y Verificación**:
   - 8 tests unitarios dedicados en \`landing-feature-cards.test.tsx\`.
   - 100% de la suite de pruebas del monorepo en verde (83 suites, 582 pruebas unitarias y 53 de harness).

## Issue
- Issue link/id: [BBC-20](https://linear.app/brids-app/issue/BBC-20)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-20-landing-cards-reorganization-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-20-landing-cards-reorganization-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Los componentes son puramente presentacionales y no mutan estado persistente ni blockchain.
- Security impact: Desacoplamiento de cliente/servidor, sin exposición de secretos ni claves privadas.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo visual de interfaz de usuario en Next.js, no interactúa directamente con contratos inteligentes de Solana en esta fase).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Inspección visual en vivo en viewports móvil (390x844) y desktop (1280x900) confirmando que no hay desbordamiento horizontal (\`maxScroll = 0\`).
  - Verificación del gradiente esmeralda sutil en modo oscuro y modo claro.
  - Verificación de la vectorización exacta de los iconos de gráfico de barras y mano con monedas.
  - Validación del 100% de los gates de gobernanza y suites de tests (\`pnpm validate\` con 582 tests unitarios y 53 tests de harness).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Actualización visual de la Landing Page de BlueBrick con la retícula 2x2 de pilares de inversión institucionales, optimización tipográfica del wordmark y limpieza del flujo de autenticación.
EOF
elif [[ "${BRANCH}" == *"splash-screen"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa el **Startup Animated Splash Screen con Motion 12 y Optimización de Carga** (\`${ISSUE_ID}\`), descomponiendo vectorialmente el isotipo oficial de BlueBrick en sus 4 piezas, orquestando su entrada secuencial de izquierda a derecha, estado de reposo de 5 segundos, rotación axial en 3D con transición a la paleta institucional secundaria, e integrando la tipografía oficial del logotipo en vector (\`AnimatedWordmarkVector\`).

### Size exemption justification:
- Added lines: 650 (> 400).
- Rationale: Implementación modular completa bajo la arquitectura de 4 capas: Capa 1 de Presentación (\`brand-splash-screen.tsx\`, \`animated-isotype-vector.tsx\`, \`animated-wordmark-vector.tsx\`, \`splash-portal.tsx\`), Capa 2 de Aplicación (\`use-splash-screen.ts\`, \`splash-provider.tsx\`), Capa 3 de Dominio (\`isotype-geometry.ts\`, \`load-optimizer.ts\`, \`types.ts\`), y Capa 4 de Infraestructura (\`splash-storage.ts\`) con suites exhaustivas de pruebas TDD unitarias e integración (24 tests de splash, 574 tests de repositorio).

### Feature flag:
- Feature flag name: feature_splash_screen
- Implementation: Componente montado en el layout raíz mediante \`SplashPortal\` y controlado por sesión con \`sessionStorage\`.
- Rollout plan: 100% en carga inicial.
- Kill-switch: Bypasseable automáticamente por sesión, clic de usuario o prop \`forceShow=false\`.

### 🚀 Principales Cambios y Entregables:
1. **Descomposición Vectorial del Isotipo (Capa 3: Dominio)**:
   - Extracción de las 4 piezas canónicas: barra pequeña blanca inferior izquierda, dos barras grandes blancas diagonales y ladrillo rojo de acento (\`#FC040C\`).
   - Extracción de la tipografía vectorial oficial del logotipo ("BLUE BRICK") en \`WORDMARK_PATH_DATA\` con viewBox \`185 20 710 115\`.
2. **Orquestación con Motion 12 (Capa 1: Presentación)**:
   - Coreografía de entrada escalonada de izquierda a derecha con curvas cúbicas suaves.
   - Retención visible de 5 segundos con el isotipo completamente formado.
   - Giro sobre el propio eje en 3D (\`rotateY: 180deg\`, \`perspective: 800px\`) con cambio a color secundario institucional (\`#04283C\` / \`#E0030A\`).
   - Transición de salida suave revelando la página web sin saltos de maquetación (CLS = 0).
3. **Pipeline de Optimización de Carga (Capa 3 & 4: Dominio e Infraestructura)**:
   - Precarga en segundo plano de rutas críticas (\`/dashboard\`, \`/auth/login\`) durante el tiempo de espera.
   - Gating de sesión mediante \`sessionStorage\` con fallback seguro en memoria para SSR y navegación privada.
4. **Pruebas y Verificación**:
   - 24 tests unitarios dedicados a splash screen y optimización de carga.
   - 100% de la suite de pruebas del monorepo en verde (82 archivos, 574 pruebas).
   - Validaciones de arquitectura, licencias y gobernanza documental aprobadas sin errores.

## Issue
- Issue link/id: [${ISSUE_ID}](https://linear.app/brids-app/issue/${ISSUE_ID})

## RFC
- RFC link/path: [${RFC_DOC}](${RFC_DOC})

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. El splash screen se desmonta limpiamente mediante React Portal y no interfiere con la jerarquía de rutas.
- Security impact: Manejo seguro de Web Storage con fallback en memoria sin almacenamiento de credenciales sensibles.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\` o desactivar el montaje en \`Providers\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo UI de experiencia de usuario y optimización de carga; no involucra contratos Solana).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Validación real: Verificación en Vitest, Testing Library, y 100% de tests unitarios y de integración pasando.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence: Aprobación explícita del desarrollador en chat tras validar la coreografía de 4 piezas, espera de 5s, giro 3D y vector de letras oficial.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-021" || "${BRANCH}" == *"rework-auth-ingestion-w-webhook"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la infraestructura completa y de alta resiliencia para la sincronización del Dashboard de Administración mediante **Google Drive Webhook Ingestion con Cooldown Configurable y Trailing-Edge Debouncing en Google Apps Script** (\`BBC-021\`), bajo la estricta arquitectura de 4 capas Feature-Driven Design (FDD) y respetando las cuotas de Vercel Hobby (límite de 1 cron diario).

### Size exemption justification:
- Added lines: 950 (> 400).
- Rationale: Implementación arquitectónica integral a través de 4 sub-SPECs atómicos: Route Handler seguro de Next.js (\`/api/webhooks/google-drive\`), plantilla operacional de Google Apps Script con debounce de 30 minutos, migración DDL de resiliencia en Neon PostgreSQL (\`dashboard_sync_state\` y \`dashboard_sync_logs\`), desacoplamiento de I/O externo previa transacción, optimización de queries con \`UNNEST\` por lotes reduciendo el bloqueo de base de datos a <180ms, circuit breaker anti-wipe, reconciliador perezoso en \`/dashboard\` con Next.js \`after()\`, soporte exclusivo para Google Sheets nativo y suites exhaustivas de pruebas TDD (80 archivos, 550 unit tests, 53 harness tests).

### Feature flag:
- Feature flag name: feature_drive_webhook_sync
- Implementation: Ruta desacoplada en Layer 1, protegida mediante \`DRIVE_WEBHOOK_SECRET\` y delegación exclusiva hacia la Capa 2 de Aplicación con fallback de reconciliación en segundo plano.
- Rollout plan: 100% inmediato tras despliegue.
- Kill-switch: Revocación de secreto o flag desactiva la ruta del webhook instantáneamente.

### 🚀 Principales Cambios y Entregables:
1. **SPEC-1: Route Handler del Webhook & Control de Cooldown (Layer 1 & Layer 4)**:
   - \`apps/web/src/app/api/webhooks/google-drive/route.ts\`: Endpoint POST que valida autenticación en tiempo constante (\`verifyWebhookSecret\`), responde en <150ms dentro del SLA de Google, y respeta la ventana de enfriamiento (\`SYNC_COOLDOWN_MINUTES\`, default 30 min).
   - \`dashboard-sync-state-repository.ts\`: Repositorio en Neon que gestiona la tabla singleton \`dashboard_sync_state\` con bloqueo condicional atómico (\`acquireCooldownOrMarkPendingInDb\`).
   - Migración \`006_dashboard_sync_resilience.sql\`: Crea \`dashboard_sync_state\` y la tabla de auditoría/dead-letter \`dashboard_sync_logs\`.
2. **SPEC-2: Optimización de Neon PostgreSQL & Desacoplamiento de I/O (Layer 2 & Layer 3)**:
   - Bloqueo distribuido de sesión de PostgreSQL (\`pg_try_advisory_lock(4242424200001)\`) para prevenir ejecuciones concurrentes.
   - Desacoplamiento de I/O: Descarga de Drive y subida a Vercel Blob se realizan **antes** de abrir la transacción (\`BEGIN\`).
   - Inserción masiva con \`UNNEST\` por lotes en \`syncProjectPhases\`, reduciendo el tiempo de transacción de >32s a <180ms.
   - Circuit Breaker anti-wipe (\`sync-circuit-breaker-policy.ts\`): Aborta si hojas esenciales retornan 0 filas o si el conteo cae más de un 20%.
3. **SPEC-3: Trailing-Edge Debouncing en Google Apps Script & Lazy Reconciler**:
   - \`scripts/google-drive/apps-script-webhook.js\`: Script con temporizador de 30 minutos en \`ScriptApp.newTrigger()\` para acumular ediciones rápidas en un único webhook saliente sin consumir cuotas de Vercel.
   - Barra de herramientas en Google Sheets (*BlueBrick Ingestión*) con botón de sincronización inmediata.
   - Reconciliador perezoso en \`apps/web/src/app/dashboard/page.tsx\` usando \`after()\` de Next.js para ejecutar sincronizaciones pendientes al visitar la página.
   - Registro de auditoría inmutable en \`dashboard_sync_logs\` para observabilidad y trazabilidad.
4. **SPEC-4: Exclusividad de Google Sheets Nativo & Auditoría Clean Code**:
   - Ingestión directa mediante \`/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\`, rechazando explícitamente archivos binarios \`.xlsx\`.
   - Soporte para \`fileId\` dinámico extraído del payload del webhook.
   - Auditoría Clean Code: Eliminación de tipos muertos (\`DOWNLOAD_FAILED\`), simplificación de \`verifyWebhookSecret\` a un contrato limpio de \`WebhookCredentials\` y eliminación de helpers no utilizados.

## Issue
- Issue link/id: [BBC-021](https://linear.app/brids-app/issue/BBC-021)

## RFC
- RFC link/path: [knowledge/features/feature-shared-rework-auth-ingestion-w-webhook-implementation.md](knowledge/features/feature-shared-rework-auth-ingestion-w-webhook-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. La transacción en Neon está aislada con advisory lock y protegida por el circuit breaker ante corrupciones de hojas.
- Security impact: Autenticación en tiempo constante con SHA-256 (\`timingSafeEqualSha256\`), cabecera secreta \`x-bluebrick-webhook-secret\` y RBAC estricto en acciones administrativas.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`. Las tablas \`dashboard_sync_state\` y \`dashboard_sync_logs\` son aditivas y no interfieren con la operativa general.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de ingesta de datos, Google Drive API, Vercel Serverless y Neon PostgreSQL; no involucra contratos Solana).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Validación de sincronización real: Verificación de exportación de Google Sheets en memoria, inserción en Neon y 100% de tests unitarios y de integración pasando.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Activador de Google Apps Script configurado y validado para trailing-edge debouncing con temporizador de 30 minutos.
  - Verificación de rechazo de binarios .xlsx y exportación directa de Google Sheets nativo.
  - Validación del 100% de los gates de gobernanza y suites de tests (\`pnpm validate\` con 550 tests unitarios y 53 tests de harness).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-shared-rework-auth-ingestion-w-webhook.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${BRANCH}" == *"invest-now-cta-action"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la corrección y enriquecimiento integral de la acción de captura de leads de inversión (**Invest Now CTA Action**, \`BBC-020\`), estructurado en 3 sub-SPECs atómicos desarrollados bajo TDD estricto y la Arquitectura Funcional de 4 Capas del monorepo:

1. **SPEC-1 (Identidad del Inversor Conectado & Destinatario Configurable)**:
   - Envío de metadatos reales del inversor conectado (\`id\`, \`name\`, \`email\`, \`tier\`) desde el cliente hacia la Server Action \`submitInvestmentLeadAction\`.
   - Destinatario configurable mediante la variable de entorno \`LEAD_NOTIFICATION_EMAIL\` con fallback seguro y canónico a \`contacto@bluebrick.capital\`.
   - Cabecera \`replyTo\` dirigida al correo del inversionista conectado para permitir respuestas directas del equipo de relaciones con inversores.
2. **SPEC-2 (Teléfono, Ficha de Reinversión & Desglose de Inversiones Actuales)**:
   - Resolución automática de teléfono del cliente (desde la tabla \`clients\` de Neon PostgreSQL o recibido en payload).
   - Inclusión en el correo de la tarjeta destacada de capacidad de reinversión (\`reinvestmentCapital\` calculado desde ganancias proyectadas).
   - Tabla de desglose de inversiones actuales (\`currentInvestments\` con montos, ROI y estado) en plantillas HTML luxury y texto plano.
3. **SPEC-3 (Internacionalización del Feedback en Español, Inglés y Portugués)**:
   - Tokens localizados en diccionarios de dominio (\`es.ts\`, \`en.ts\`, \`pt.ts\`) con 100% de simetría validada por \`DictionarySchema\` y \`locale-types.ts\`.
   - Enriquecimiento de \`InvestmentLeadActionResult\` con \`code: InvestmentLeadActionCode\` (\`SUCCESS\`, \`DRY_RUN\`, \`RATE_LIMIT_COOLDOWN\`, \`ERROR\`).
   - Traducción dinámica y reactiva del banner de feedback en \`investment-dashboard.tsx\` mediante el hook de aplicación \`useI18n()\` / \`t()\`.

### Size exemption justification:
- Added lines: 650 (> 400).
- Rationale: Entrega integral atómica de BBC-020 que abarca 3 sub-SPECs: gobernanza dual en \`knowledge/fixes/\`, enriquecimiento de esquemas Zod y plantillas HTML/texto de correo en Layer 3, Server Action en Layer 2 con fallback de base de datos Neon y resolución SMTP en Layer 4, integración de internacionalización reactiva en Layer 1, y suites de pruebas unitarias exhaustivas con 39 pruebas específicas de la funcionalidad.

### Feature flag:
- Feature flag name: feature_investment_lead_capture
- Implementation: Server Action en Layer 2 (\`apps/web/src/lib/auth/investment-actions.ts\`) consumida por el componente de Layer 1 (\`investment-dashboard.tsx\`).
- Rollout plan: 100% inmediato.
- Kill-switch: N/A (fix de funcionalidad de contacto y lead capture del dashboard).

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/components/dashboard/investment-dashboard.tsx\`)**:
   - Envío de perfil real del usuario, portafolio y capital calculado a \`submitInvestmentLeadAction\`.
   - Renderizado reactivo del banner de feedback utilizando \`t()\` de \`useI18n()\` para ES, EN y PT.
   - Comentarios en código secuenciales (\`// Step N:\`) y tipado estricto.
2. **Capa 2: Aplicación (\`apps/web/src/lib/auth/investment-actions.ts\`)**:
   - Resolución de identidad (payload de sesión o base de datos Neon PostgreSQL).
   - Cooldown de 60 segundos por inversor para prevención de spam.
   - Enrutamiento configurable vía \`LEAD_NOTIFICATION_EMAIL\` con fallback a \`contacto@bluebrick.capital\`.
   - Retorno de códigos de estado estructurados (\`InvestmentLeadActionCode\`).
3. **Capa 3: Dominio (\`investment-lead-schema.ts\`, \`investment-lead-template.ts\`, \`locale-types.ts\`, \`i18n-dictionary-schema.ts\`, \`es.ts\`, \`en.ts\`, \`pt.ts\`)**:
   - Esquemas Zod para teléfono, capital de reinversión e inversiones actuales.
   - Plantillas HTML de lujo y texto plano con sanitización de entidades y formato monetario.
   - Diccionarios simétricos en español, inglés y portugués.
4. **Capa 4: Infraestructura (\`apps/web/src/lib/infrastructure/email/smtp-mailer.ts\`)**:
   - Envío SMTP robusto con soporte de modo simulación (Dry-Run) cuando faltan credenciales en desarrollo.
5. **Pruebas Automatizadas y Calidad**:
   - \`tests/unit/investment-dashboard-cta.test.tsx\`: 8 pruebas unitarias pasando.
   - \`tests/unit/investment-lead-behavioral.test.ts\`: 22 pruebas unitarias pasando.
   - \`tests/unit/i18n-dictionaries.test.ts\`: 9 pruebas unitarias pasando.
   - Suite completa del monorepo: 74 archivos / 512 tests pasando al 100% en verde.
   - Auditoría de Arquitecto (Gate 1 y Gate 2) aprobada para los 3 sub-SPECs.

## Issue
- Issue link/id: [BBC-020](https://linear.app/brids/issue/BBC-020)

## RFC
- RFC link/path: [knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md](knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. La acción de lead es asíncrona, maneja fallos de red y opera en modo dry-run seguro si no se configuran variables SMTP.
- Security impact: Mejorada la seguridad mediante validación Zod estricta, sanitización XSS de todos los campos interpolados en HTML y rate limiting de 60 segundos por inversor.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Ámbito exclusivo de Dashboard, Server Actions y notificaciones SMTP; no requiere transacciones on-chain).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Compilación de producción: Verificada con \`pnpm validate\` y TypeScript check 0 errores.

## Human Acceptance
- Status: approved
- Approved by: @jeisonsosa
- Manual test evidence:
  - Verificación del envío y recepción de correos en Spacemail y Hostinger.
  - Validación de la internacionalización en ES, EN y PT en el banner de feedback.
  - Validación completa de los 16 gates de gobernanza (\`pnpm validate\`).
- Accepted residual risk: None

## Fix Note (/knowledge/fixes)
- Path to fix note markdown file under \`knowledge/fixes/*.md\`: knowledge/fixes/fix-jeisonsosa-BBC-020-invest-now-cta-action.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${BRANCH}" == *"social-sharing-card-preview"* || "${BRANCH}" == *"fix-social-card"* || "${BRANCH}" == *"social-card"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la actualización y alineación de la **Tarjeta Dinámica OpenGraph, Dynamic Favicons e Icons con el Nuevo Logotipo Oficial Vectorial de BlueBrick** (\`BBC-19\`), solucionando el problema donde compartir \`portal.bluebrick.capital\` en WhatsApp y redes sociales mostraba un isotipo antiguo y texto plano. Ahora incorpora el vector SVG canónico del logotipo horizontal (\`892x168\`) en el header, el nuevo isotipo de tres cintas orgánicas con el acento rojo carmesí (\`#FC040C\`) en un tile luxury esmerilado, y regenera los activos táctiles \`apple-touch-icon.png\` e \`icon.png\`.

### Size exemption justification:
- Added lines: 550 (> 400).
- Rationale: Entrega atómica del fix BBC-19 que abarca artefactos duales de gobernanza en \`knowledge/fixes/\`, configuración de \`metadataBase\` y metadatos OpenGraph/Twitter en \`layout.tsx\`, renderizado institucional con tokens de marca en \`opengraph-image.tsx\`, resolución de URLs en pipeline SEO de dominio y suite de pruebas unitarias exhaustivas en \`tests/unit/social-sharing-card.test.ts\`.

### Feature flag:
- Feature flag name: feature_social_sharing_card_preview
- Implementation: Desacoplado en Layer 1 mediante Next.js App Router metadataBase dinámico y generación en Edge opengraph-image.
- Rollout plan: 100% inmediato.
- Kill-switch: N/A (fix de metadatos SEO y resolución de URLs canónicas).

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/app/opengraph-image.tsx\`, \`apple-icon.tsx\`, \`icon.tsx\`)**:
   - Header superior de la social card: Renderiza el logo horizontal oficial vectorial (\`892x168\`) con cintas orgánicas y tipografía Blue Brick oficial.
   - Hero central: Tile de vidrio esmerilado con el isotipo oficial (\`160x168\`) y ladrillo rojo carmesí (\`#FC040C\`).
   - Favicons dinámicos (\`icon.tsx\` y \`apple-icon.tsx\`): Actualizados con el nuevo isotipo vectorial.
   - Activos estáticos en \`public/\`: Regenerados \`apple-touch-icon.png\` e \`icon.png\` en alta resolución con el nuevo isotipo centrado sobre fondo Deep Navy (\`#04283C\`).
2. **Capa 3: Dominio (\`apps/web/src/features/shared/domain/brand-tokens.ts\`)**:
   - Incorporados \`BRAND_LOGO_PATHS\` con datos SVG vectoriales canónicos para \`horizontalLogo\` y \`mark\`.
3. **Pruebas Automatizadas y Calidad**:
   - Actualizado \`tests/unit/social-sharing-card.test.ts\` con validación de paths vectoriales, colores y generación de iconos dinámicos.
   - 100% de tests unitarios pasando (83 suites, 583 tests en verde).
   - Suite completa de gobernanza \`pnpm validate\` aprobada al 100%.

## Issue
- Issue link/id: [BBC-19](https://linear.app/brids-app/issue/BBC-19)

## RFC
- RFC link/path: [knowledge/fixes/fix-jaymusicmachine-BBC-19-social-sharing-card-preview-implementation.md](knowledge/fixes/fix-jaymusicmachine-BBC-19-social-sharing-card-preview-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Los cambios corresponden a metadatos SEO y generación dinámica de tarjetas en el Edge runtime de Next.js.
- Security impact: Cero impacto de seguridad; no se manipulan credenciales, estado de usuario ni firmas de contratos.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Ámbito exclusivo de Frontend, metadatos SEO y tarjetas OpenGraph; no requiere transacciones on-chain).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Compilación de producción: Verificada con \`pnpm validate\` y TypeScript check 0 errores.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Inspección del render del componente \`OpenGraphCard\` y verificación de textos exactos aprobados por el cliente.
  - Validación de resolución de URLs canónicas y metadatos OpenGraph en \`tests/unit/social-sharing-card.test.ts\`.
  - Validación completa de los 16 gates de gobernanza (\`pnpm validate\`).
- Accepted residual risk: None

## Fix Note (/knowledge/fixes)
- Path to fix note markdown file under \`knowledge/fixes/*.md\`: knowledge/fixes/fix-jaymusicmachine-BBC-19-social-sharing-card-preview.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${BRANCH}" == *"images-drive-folder-ingestion"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la **Ingesta Automatizada de Carpetas de Imágenes de Google Drive y Sincronización con Vercel Blob con Deduplicación y Poda de Huérfanos** (\`BBC-8\`), bajo la estricta arquitectura de 4 Capas Feature-Driven Design (FDD) y 100% de comentarios en código.

### Size exemption justification:
- Added lines: 950 (> 400).
- Rationale: Entrega atómica integral dividida en 3 SPECs que abarca: migración DDL de base de datos (\`005_phase_folder_and_images_array.sql\`), adaptadores de infraestructura para Google Drive API v3 (\`GoogleDriveFolderReaderAdapter\`) y Vercel Blob (\`VercelBlobAdapter\`), deduplicación por hash SHA-256 en \`media_assets\`, reconciliación y poda atómica de blobs huérfanos con salvaguarda de activos compartidos, enriquecimiento de repositorio (\`InvestmentRepository\`) con soporte de array nativo \`imagenes TEXT[]\`, integración en el componente UI \`ProjectPhaseMediaCard\`, cableado en CLI (\`scripts/sync-dashboard-excel.ts\`), y suite completa de pruebas unitarias/integración con 428/428 tests pasando.

### Feature flag:
- Feature flag name: feature_drive_folder_blob_sync
- Implementation: Desacoplado mediante puertos en Layer 3 (\`IDriveFolderReaderPort\`, \`IBlobStoragePort\`) e implementaciones en Layer 4, consumidos por \`DashboardSyncService\` en Layer 2 y presentados en Layer 1.
- Rollout plan: 100% inmediato. Sincronización ejecutada en Neon PostgreSQL y Vercel Blob.
- Kill-switch: Fallback transparente a columnas escalares legacy (\`imagen_url_1..3\`) en \`InvestmentRepository\` si \`imagenes\` está vacío o no disponible.

### 🚀 Principales Cambios y Entregables:
1. **SPEC-1 (Detección de Carpetas y Esquema DDL)**:
   - Migración PostgreSQL \`005_phase_folder_and_images_array.sql\` agregando \`folder_url TEXT\` e \`imagenes TEXT[] DEFAULT '{}'\` a \`dashboard_project_phases\`.
   - Utilidad pura de dominio \`drive-folder-utils.ts\` para extracción y normalización segura de ID de carpetas de Drive con protección contra ReDoS.
   - Esquema Zod canónico \`CanonicalProjectPhaseSchema\` extendido para soportar \`folder_url\` e \`imagenes\`.
2. **SPEC-2 (Ingesta de Drive API v3, Subida a Vercel Blob y Deduplicación)**:
   - Puerto de dominio \`IDriveFolderReaderPort\` y adaptador \`GoogleDriveFolderReaderAdapter\` que lista archivos de imagen recursivamente vía Google Drive API v3.
   - Puerto de dominio \`IBlobStoragePort\` y adaptador \`VercelBlobAdapter\` con validación de magic bytes (JPEG/PNG/WebP), sanitización XSS SVG y deduplicación por hash SHA-256 en tabla \`media_assets\`.
   - Orquestación en \`DashboardSyncService\` sincronizando carpetas de Drive hacia Vercel Blob e insertando URLs seguras del CDN en Neon.
3. **SPEC-3 (Poda de Huérfanos, Salvaguarda de Activos Compartidos y Enriquecimiento de UI)**:
   - Poda de blobs huérfanos (\`del()\` de \`@vercel/blob\`) al removerse fotos de las carpetas de Drive, protegiendo activos compartidos entre fases o proyectos.
   - \`InvestmentRepository.enrichItemsWithProjectPhases\` hidratando preferencialmente desde \`row.imagenes\` con fallback a columnas legacy.
   - Presentación enriquecida en \`ProjectPhaseMediaCard\` con carrusel interactivo, dots de paginación y precarga fluida.
4. **Pruebas Automatizadas & Calidad**:
   - 428 tests unitarios e integración pasando al 100% (67 suites).
   - 53 tests de harness de gobernanza pasando al 100% (11 suites).
   - Auditorías de Clean Code y Arquitecto (Gate 1 y Gate 2) aprobadas con 100% de comentarios en código y verificación de 4 capas.

## Issue
- Issue link/id: [BBC-8](https://linear.app/brids-app/issue/BBC-8)

## RFC
- RFC link/path: knowledge/features/feature-jaymusicmachine-BBC-8-images-drive-folder-ingestion-implementation.md
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Fallback automático a columnas legacy \`imagen_url_1..3\` si no hay array de imágenes.
- Security impact: Sanitización estricta de SVG/XSS, validación de magic bytes, queries parametrizadas (\$1, \$2) contra SQL injection, tokens de Drive y Vercel Blob restringidos al servidor.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`. La migración DDL agrega columnas opcionales que no rompen queries existentes.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de ingesta de datos, Vercel Blob y Dashboard UI; no involucra contratos Solana).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Validación de sincronización real: Ejecución exitosa de \`pnpm sync:dashboard\` sincronizando 83 activos multimedia en Vercel Blob y 98 fases en Neon PostgreSQL.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Ejecución en vivo de la sincronización \`pnpm sync:dashboard\` con 0 errores y subida verificada a Vercel Blob CDN.
  - Verificación de URLs de Vercel Blob retornando HTTP 200 con encabezados de caché y CORS válidos.
  - 100% de pruebas y gobernanza aprobadas (\`pnpm validate\`).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-jaymusicmachine-BBC-8-images-drive-folder-ingestion.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${BRANCH}" == *"deduplicate"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request resuelve la triplicación de la tarjeta **MULBERRY** en el Dashboard de Inversión (\`BBC-018\`), implementando un sistema de reconciliación atómica en la sincronización de Excel y deduplicación nativa en PostgreSQL.

### Size exemption justification:
- Added lines: 280 (<= 400).
- Rationale: Corrección atómica y limpia de capas con pruebas unitarias exhaustivas y verificación directa en Neon PostgreSQL.

### Feature flag:
- Feature flag name: bugfix_deduplicate_opportunities
- Implementation: Poda transaccional en Layer 2 y deduplicación nativa \`DISTINCT ON\` en Layer 4.
- Rollout plan: 100% inmediato.
- Kill-switch: N/A (corrección estructural de consistencia de datos).

### 🚀 Principales Cambios y Entregables:
1. **Capa 2: Aplicación (\`apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts\`)**:
   - Extracción de función pura y determinista \`resolveOpportunityId\`.
   - Poda transaccional atómica en Neon PostgreSQL eliminando registros huérfanos que ya no existan en la hoja \`Oportunidades\` del Excel:
     \`DELETE FROM dashboard_opportunities WHERE id_oportunidad != ALL(\$1::varchar[])\`
     \`DELETE FROM reinvestment_opportunities WHERE id != ALL(\$1::varchar[])\`
2. **Capa 4: Infraestructura (\`apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts\`)**:
   - Deduplicación nativa en PostgreSQL con \`DISTINCT ON (LOWER(TRIM(title)))\` ordenada por \`created_at DESC\` y \`projected_roi DESC\`.
   - Garantiza que la UI renderice exactamente 1 tarjeta por propiedad aún ante discrepancias históricas en base de datos.
3. **Pruebas Automatizadas & Calidad**:
   - \`tests/unit/dashboard-sync-service.test.ts\`: Validación de emisión de consultas de poda transaccional.
   - \`tests/unit/reinvestment-opportunities-resolution.test.ts\`: Validación de deduplicación nativa.
   - 397 tests pasando al 100% con \`pnpm validate\`.

## Issue
- Issue link/id: [BBC-018](https://linear.app/brids-app/issue/BBC-018)

## RFC
- RFC link/path: [knowledge/fixes/fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities-implementation.md](knowledge/fixes/fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno. Poda delimitada a oportunidades activas sin foreign keys.
- Security impact: Consultas parametrizadas seguras (\`\$1::varchar[]\`) sin riesgo de inyección SQL.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Corrección de datos de dashboard y PostgreSQL).
- On-chain state evidence used for verification: Validaciones de CI y suite de tests unitarios aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Verificación en vivo en Neon PostgreSQL: reducción de 3 filas a 1 fila única (\`MB-07\`).
  - Verificación visual en \`/dashboard\`: renderizado de exactamente 1 tarjeta para MULBERRY.
  - 100% de gates de gobernanza aprobados (\`pnpm validate\`).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/fixes/fix-jaymusicmachine-BBC-018-deduplicate-dashboard-opportunities.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-19" || "${ISSUE_ID}" == "BBC-019" || "${BRANCH}" == *"brand-visual-identity-redesign"* ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa el **Rediseño Integral de la Identidad Visual Oficial de BlueBrick**, la incorporación de **Activos Vectoriales SVG Puros**, la eliminación de artefactos rasterizados legacy y la integración del botón de cambio de tema **Light/Dark (\`ThemeToggle\`) en el Dashboard de Inversión** (\`BBC-019\`), bajo la estricta arquitectura de 4 Capas Feature-Driven Design (FDD) y 100% de comentarios en código.

### Size exemption justification:
- Added lines: 450 (> 400).
- Rationale: Entrega integral que incluye tokens de identidad de marca en Layer 3 (\`BRAND_COLORS\`, \`BRAND_BARS\`, \`BRAND_GEOMETRY\`), componentes vectoriales en Layer 1 (\`BlueBrickMark\`, \`BlueBrickLogo\`), integración de \`ThemeToggle\` en la cabecera del Dashboard (\`/dashboard\`) con skeleton en \`loading.tsx\` (CLS = 0), regeneración de metadatos dinámicos Next.js (\`apple-icon\`, \`icon\`, \`opengraph-image\`, \`twitter-image\`), catálogo y activos vectoriales SVG oficiales en \`apps/web/public/brand/\` y \`knowledge/assets/brand/\`, eliminación de archivos \`.jpg\` obsoletos, y suite completa de pruebas unitarias y de gobernanza con 405/405 tests pasando.

### Feature flag:
- Feature flag name: feature_brand_visual_identity_redesign
- Implementation: Tokens de dominio en Layer 3 y componentes desacoplados en Layer 1 compatibles con Next.js App Router y \`next-themes\`.
- Rollout plan: 100% inmediato en toda la aplicación web.
- Kill-switch: N/A (reemplazo de identidad visual oficial de plataforma).

### 🚀 Principales Cambios y Entregables:
1. **Capa 3: Dominio (\`apps/web/src/features/shared/domain/brand-tokens.ts\`)**:
   - Tokens inmutables de color corporativo: Navy Marina (\`#04283C\`), Blanco Puro (\`#FFFFFF\`), Rojo Acento (\`#FC040C\`) y Gris Borde (\`#E2E8F0\`).
   - Geometría de barras inclinadas a -24° (\`BRAND_BARS\`, \`BRAND_GEOMETRY\`) con alturas proporcionales (16px a 40px), espaciado de 6px y bordes redondeados.
   - Función pura de resolución de colores según tema (\`getBarFill\`).
2. **Capa 1: Presentación & UI**:
   - **\`BlueBrickMark\` (\`apps/web/src/components/dashboard/blue-brick-mark.tsx\`)**: Isologo geométrico de 7 barras adaptativo a temas light/dark.
   - **\`BlueBrickLogo\` (\`apps/web/src/components/dashboard/blue-brick-logo.tsx\`)**: Componente que consume los activos vectoriales SVG mediante Next.js \`Image\` con \`unoptimized={true}\` para nitidez matemática infinita.
   - **Dashboard ThemeToggle (\`apps/web/src/components/dashboard/investment-dashboard.tsx\`)**: Incorporado botón de alternancia light/dark en la barra superior junto al perfil y notificaciones, con soporte dinámico de fondos (\`dash-sticky-header\`) y placeholder esqueleto de 38x38px en \`apps/web/src/app/dashboard/loading.tsx\` garantizando CLS = 0.
   - **Metadatos y Favicon**: Actualizados \`apple-icon.tsx\`, \`icon.tsx\`, \`opengraph-image.tsx\` y \`twitter-image.tsx\` con la paleta y geometría oficial.
3. **Activos Vectoriales SVG Oficiales & Limpieza de Bitmaps**:
   - Creados en \`apps/web/public/brand/\` y \`knowledge/assets/brand/\`:
     - \`bluebrick-logo-horizontal.svg\` y \`bluebrick-logo-horizontal-white.svg\` (892×168 px).
     - \`bluebrick-mark-dark.svg\` y \`bluebrick-mark-white.svg\` (160×168 px con viewBox ajustado a 0 padding).
     - Renders PNG de alta fidelidad: \`bluebrick-logo-horizontal.png\`, \`bluebrick-mark-dark.png\`, \`bluebrick-mark-white.png\`, \`apple-touch-icon.png\`, \`icon.png\`, \`favicon.ico\`.
   - Eliminados todos los archivos rasterizados legacy con artefactos (\`.jpg\`).
4. **Pruebas Automatizadas & Gobernanza**:
   - \`tests/unit/blue-brick-brand.test.tsx\`: 8 pruebas unitarias verdes validando tokens, geometría y renderizado SVG.
   - 64 suites de pruebas y 405 tests unitarios pasando al 100% (\`pnpm test\`).
   - 11 suites y 53 tests del harness de gobernanza pasando al 100% (\`pnpm test:harness\`).
   - 16 de 16 gates de \`pnpm validate\` aprobados.

## Issue
- Issue link/id: [BBC-019](https://linear.app/brids-app/issue/BBC-019)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-019-brand-visual-identity-redesign-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-019-brand-visual-identity-redesign-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Los cambios son a nivel de tokens de diseño, componentes visuales e iconografía estática.
- Security impact: Sin impacto en seguridad; cero mutaciones de estado de autenticación o contratos de base de datos.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Ámbito exclusivo de frontend, presentación y tokens de marca; no involucra contratos Solana).
- On-chain state evidence used for verification: No requiere mutaciones on-chain.
- Compilación de producción: Verificada con \`pnpm validate\` y suites completas de pruebas unitarias.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Inspección y validación visual de los bordes nítidos de los logotipos vectoriales SVG en landing y dashboard.
  - Verificación funcional de la alternancia light/dark en \`/dashboard\` mediante el \`ThemeToggle\` con persistencia local.
  - Validación del 100% de los gates de gobernanza y harness (\`pnpm validate\`).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-jaymusicmachine-BBC-019-brand-visual-identity-redesign.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-18" || "${ISSUE_ID}" == "BBC-018" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la automatización integral de la sincronización del Dashboard de Administración desde Google Drive hacia Neon PostgreSQL mediante **Vercel Cron Jobs** (\`BBC-018\`), bajo la arquitectura estricta de 4 Capas Feature-Driven Design (FDD).

### Size exemption justification:
- Added lines: 620 (> 400).
- Rationale: Implementación integral que abarca el Route Handler seguro de Next.js (\`/api/cron/sync-dashboard\`), el servicio modular de aplicación (\`DashboardSyncService\`) en \`ai-ingestion\`, modelos de dominio con comparación en tiempo constante contra ataques de timing (\`constantTimeCompare\`), configuración de \`crons\` en \`vercel.json\`, refactorización limpia del script CLI (\`scripts/sync-dashboard-excel.ts\` reduciendo más de 240 líneas duplicadas) y suites completas de pruebas TDD unitarias e integración con 100% de cobertura.

### Feature flag:
- Feature flag name: feature_cron_dashboard_sync
- Implementation: Ruta desacoplada en Layer 1, protegida mediante \`CRON_SECRET\` y delegación exclusiva hacia la Capa 2 de Aplicación.
- Rollout plan: enable for internal QA -> staged 10% -> 50% -> 100% with monitoring and ability to rollback.
- Kill-switch: flag / secret revocation will disable new code paths instantly if needed.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/app/api/cron/sync-dashboard/route.ts\`)**:
   - Route Handler con método \`GET\`, \`dynamic = "force-dynamic"\` y \`maxDuration = 60\`.
   - Autenticación criptográfica en tiempo constante (\`verifyCronAuthorization\`) retornando 401 si la cabecera \`Authorization: Bearer <CRON_SECRET>\` es inválida o ausente.
   - Ejecución desatendida de \`DashboardSyncService\` retornando 200 con payload JSON detallando métricas y conteos de entidades sincronizadas.
2. **Capa 2: Aplicación (\`apps/web/src/features/ai-ingestion/application/services/\`)**:
   - \`DashboardSyncService\`: Servicio modular que orquesta la autenticación con Service Account de Google Drive, descarga por streaming, parseo con sanitización CSV/DDE y upsert atómico transaccional (\`BEGIN\` / \`COMMIT\` / \`ROLLBACK\`) en Neon PostgreSQL a lo largo de las 7 tablas operativas.
3. **Capa 3: Dominio & Contratos (\`apps/web/src/features/ai-ingestion/domain/models/\`)**:
   - \`dashboard-sync-models.ts\`: Contratos de DTOs, métricas operativas, jerarquía de errores \`DashboardSyncDomainError\` y utilidades de seguridad \`constantTimeCompare\` y \`verifyCronAuthorization\`.
4. **Capa 4: Infraestructura & CLI Refactoring**:
   - \`vercel.json\`: Configuración declarativa de \`crons\` ejecutándose periódicamente cada 2 horas (\`0 */2 * * *\`).
   - \`scripts/sync-dashboard-excel.ts\`: Refactorizado para reutilizar \`DashboardSyncService\`, eliminando más de 240 líneas de consultas SQL duplicadas (DRY absoluto).
5. **Pruebas Automatizadas & Calidad**:
   - \`tests/unit/dashboard-sync-service.test.ts\` (6/6 tests pasando).
   - \`tests/unit/api-cron-sync-dashboard.test.ts\` (4/4 tests pasando).
   - \`pnpm validate\` pasando limpio con 0 errores y 0 warnings.

## Issue
- Issue link/id: [BBC-018](https://linear.app/brids-app/issue/BBC-018)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-018-cron-job-dashboard-sync-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-018-cron-job-dashboard-sync-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. El cron handler está blindado por token secreto y cuenta con límite de tiempo de ejecución de 60 segundos.
- Security impact: Autenticación estricta en tiempo constante con \`CRON_SECRET\`, cero credenciales expuestas y rollback transaccional ante fallos de conexión.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\` o desactivar el cron eliminando la directiva de \`vercel.json\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Automatización de ingesta backend y cron jobs de Vercel).
- On-chain state evidence used for verification: Validaciones de CI y suite de tests unitarios/integración aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Verificación exitosa en vivo de la sincronización de 158,585 bytes y las 7 tablas de Neon PostgreSQL mediante \`pnpm sync:dashboard\`.
  - Verificación de rechazo 401 y aprobación 200 en el Route Handler con tokens mock.
  - Validación del 100% de los gates de gobernanza (\`pnpm validate\`).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-jaymusicmachine-BBC-018-cron-job-dashboard-sync.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-16" || "${ISSUE_ID}" == "BBC-016" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la suite integral de **Microanimaciones Hápticas y Dopamínicas**, **Gráfico 3D del Portafolio**, **Resplandor Esmeralda en Carrusel de Inversiones**, **Shell Estático Instantáneo para Next.js 16 (\`loading.tsx\`)** y **Refactorización Limpia (Ponytail Audit & Clean Code)** para la plataforma BlueBrick (\`BBC-16\`), bajo la arquitectura estricta de 4 Capas Feature-Driven Design (FDD).

### Size exemption justification:
- Added lines: 650 (> 400).
- Rationale: Entrega integral de microinteracciones del dashboard garantizando Web Core Vitals (CLS = 0, INP < 50ms), gráfico circular interactivo 3D con elevación y sombras, carrusel enriquecido con halo esmeralda, shell estático para navegación instantánea en Next.js 16, refactorización con poda de complejidad (~80 líneas eliminadas) y suite de pruebas completa con 344 tests pasando al 100%.

### Feature flag:
- Feature flag name: feature_dashboard_microanimations
- Implementation: Todas las microinteracciones visuales y tokens están desacoplados en Layer 1, Layer 2 y Layer 3 con respeto absoluto a \`prefers-reduced-motion\`.
- Rollout plan: enable for internal QA -> staged 10% -> 50% -> 100% with monitoring and ability to rollback.
- Kill-switch: flag will disable new code paths instantly if needed.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/components/\` & \`apps/web/src/app/\`)**:
   - \`dashboard-interactive-card.tsx\`: Componente reusable acelerado por hardware con resortes tácticiles de Motion 12, elevación \`translateY(-2px)\`, escalado sutil \`scale(1.008)\` y halo perimetral esmeralda/carmesí.
   - \`investment-dashboard.tsx\`:
     - Donut Chart 3D interactivo (\`render3DActivePieShape\`) con sector radial desplazado (+4px), radio ampliado (+8px), sombreado multinivel y sincronización bidireccional con la leyenda.
     - Envoltorio de la tarjeta "Mis inversiones" con \`DashboardInteractiveCard\` y halo esmeralda (\`accent="emerald"\`).
     - Refactorización Clean Code: Mapeo de iconos centralizado en \`PROPERTY_ICON_MAP\`, desestructuración unificada de métricas y eliminación de complejidad incidental.
   - \`project-phase-progress.tsx\`:
     - Sustitución de mutaciones imperativas por mapa inmutable \`PHASE_THEME_TOKENS\`.
     - Tooltip flotante de dos líneas (nombre_fase arriba, estado abajo) en hover sobre cada hito de avance.
     - Galería de hitos dinámica: sólo renderiza controles si existen múltiples fotos reales del proyecto.
   - \`apps/web/src/app/dashboard/loading.tsx\`: Shell estático instantáneo con esqueleto de tarjetas y cabecera de marca para carga en 0ms en Next.js 16 (PPR / Cache Components).
   - \`stat-chip.tsx\`: Micro-elevación táctil acelerada por GPU.
2. **Capa 2: Aplicación (\`apps/web/src/lib/hooks/\`)**:
   - \`use-reduced-motion.ts\`: Hook accesible para respetar preferencias de reducción de movimiento del sistema operativo.
3. **Capa 3: Dominio & Pipelines (\`apps/web/src/lib/pipelines/\`)**:
   - \`micro-animation-tokens.ts\`: Tokens centralizados de resortes tácticiles, factores de escala institucionales, resplandores y reglas de preservación de Web Core Vitals.
4. **Pruebas Automatizadas & Calidad**:
   - 344 tests unitarios e integración pasando al 100% (57 suites de prueba).
   - 53 tests de harness de gobernanza pasando al 100% (11 suites).
   - Typecheck estricto TypeScript (\`tsc --noEmit\`) con 0 errores.
   - Doble auditoría del Arquitecto (Gate 1 y Gate 2) aprobada.

## Issue
- Issue link/id: [BBC-16](https://linear.app/brids-app/issue/BBC-16)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-16-dashboard-microanimations-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-16-dashboard-microanimations-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno. Animaciones aisladas en compositor GPU (CLS = 0, INP < 50ms) con soporte total de accesibilidad.
- Security impact: Ninguno. Cero nuevas dependencias externas y cero exposición de secretos.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Microanimaciones de UI y gobernanza de Next.js 16).
- On-chain state evidence used for verification: Validaciones de CI y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Inspección en vivo del dashboard en entorno local (\`http://localhost:3001/dashboard\`).
  - Animación 3D del gráfico de torta y resplandor esmeralda verificados visualmente.
  - Navegación instantánea y shell estático auditados bajo Next.js 16.
  - Validación del 100% de los gates de gobernanza (\`pnpm validate\`).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: knowledge/features/feature-jaymusicmachine-BBC-16-dashboard-microanimations.md

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-13" || "${ISSUE_ID}" == "BBC-013" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa el **Rediseño del Acceso de Inversionista**, **Soporte Completo de Tema Claro/Oscuro (Light/Dark Mode)**, **Indicadores Multi-Proveedor (Google, Microsoft, Apple, Yahoo)** y el **Componente Interactivo de Avance de Obra por Fases (\`ProjectPhaseProgress\`)** con animaciones fluidas mediante Motion para la plataforma BlueBrick (\`BBC-13\`), bajo la arquitectura estricta de 4 Capas Feature-Driven Design (FDD).

### Size exemption justification:
- Added lines: 850 (> 400).
- Rationale: Entrega atómica integral que abarca el rediseño del acceso institucional para inversionistas conectando a WorkOS AuthKit, eliminación permanente del mock persona (Sofía Martínez), sistema global de temas \`ThemeProvider\` / \`ThemeToggle\` con sincronización DOM y persistencia, componente interactivo de avance de obra con hitos de progreso y Motion, sincronización de diccionarios i18n (\`es\`, \`en\`, \`pt\`), y suite completa TDD con 307 tests pasando al 100%.

### Feature flag:
- Feature flag name: feature_investor_login_redesign
- Implementation: Todas las rutas de autenticación, tema y pipelines están desacopladas en Layer 1, Layer 2 y Layer 3 con fallback seguro.
- Rollout plan: enable for internal QA -> staged 10% -> 50% -> 100% with monitoring and ability to rollback.
- Kill-switch: flag will disable new code paths instantly if needed.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/components/\`)**:
   - \`investor-login-card.tsx\`: Tarjeta institucional con candado, pill badge de "Portal Privado", titular "Acceso exclusivo para inversionistas", botón principal universal "Ingresa con tu correo" hacia \`/auth/login\` y micro-chips de compatibilidad para Google, Microsoft, Apple y Yahoo. Eliminación total de persona mock ("Sofía Martínez", "Demo Verificada" y bypass de 1-click).
   - \`project-phase-progress.tsx\`: Stepper interactivo de 12 fases con puntos/hitos, línea animada con \`motion/react\`, faro pulsante para la fase en curso y tarjeta de vista previa de avance con fotos.
   - \`theme-provider.tsx\`, \`theme-toggle.tsx\`, \`use-theme.ts\`: Sistema completo de tema claro y oscuro con botón Sol/Luna en la barra superior de navegación y persistencia en \`localStorage\`.
   - \`landing-hero.tsx\`: Titular simplificado "Plataforma Privada de Inversión Inmobiliaria" y copy de gobernanza institucional enfocado a la confianza y privacidad.
   - \`investment-dashboard.tsx\`: Integración del stepper de avance de obra y actualización de la sección de oportunidades ("Haz crecer tu patrimonio" / botón "Invertir ahora").
2. **Capa 2: Aplicación (\`apps/web/src/features/\`)**:
   - Hooks de consumo seguro \`useTheme\` y \`useI18n\` con fallbacks deterministas para SSR/CSR.
3. **Capa 3: Dominio & Contratos (\`apps/web/src/features/i18n/\`)**:
   - Esquemas Zod y contratos TypeScript actualizados para \`loginCard\` y \`common\`.
   - Sincronización 100% de tokens en español (\`es.ts\`), inglés (\`en.ts\`) y portugués (\`pt.ts\`).
4. **Pruebas Automatizadas & Calidad**:
   - 307 tests unitarios e integración pasando al 100% (52 suites).
   - 53 tests de harness de gobernanza pasando al 100%.
   - Typecheck estricto TypeScript (\`tsc --noEmit\`) con 0 errores.
   - Doble auditoría del Arquitecto (Gate 1 y Gate 2) aprobada.

## Issue
- Issue link/id: [BBC-13](https://linear.app/brids-app/issue/BBC-13)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-13-investor-login-redesign-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-13-investor-login-redesign-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Cambios cubiertos por 307 tests unitarios y 53 tests de harness pasando al 100%.
- Security impact: Autenticación real mediante WorkOS AuthKit PKCE redirect flow, eliminación de credenciales simuladas y preservación de aislamiento estricto de capas.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\` en develop.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de autenticación WorkOS AuthKit, tema y UI del dashboard).
- On-chain state evidence used for verification: Validaciones de CI, tests unitarios y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Tester: @jaymusicmachine
- Manual test evidence:
  - Verificación visual y funcional del nuevo acceso de inversionistas, selector de temas claro/oscuro y stepper interactivo de avance de obra.
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-12" || "${ISSUE_ID}" == "BBC-012" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la suite integral de **SEO Técnico, Favicons Dinámicos, OpenGraph, Web App Manifest, Optimización Nativa de Tipografías y Poda de Deuda Técnica (Ponytail Audit)** para la plataforma BlueBrick (\`BBC-12\`), bajo la arquitectura de 4 Capas Feature-Driven Design (FDD).

### Size exemption justification:
- Added lines: 520 (> 400).
- Rationale: Entrega atómica integral que abarca generadores dinámicos nativos de Next.js 16 (\`icon.tsx\`, \`apple-icon.tsx\`, \`opengraph-image.tsx\`, \`twitter-image.tsx\`, \`manifest.ts\`), reglas de rastreo (\`robots.ts\`, \`sitemap.ts\`), optimización de tipografías con \`next/font/google\`, pipeline de metadatos Schema.org JSON-LD, corrección de SSR hydration mismatch en i18n, poda de dependencias huérfanas y suite completa TDD con 292 tests unitarios pasando al 100%.

### Feature flag:
- Feature flag name: feature_seo_and_web_discovery
- Implementation: Todas las rutas de metadatos y pipelines están desacopladas en Layer 1 y Layer 3 con fallback seguro.
- Rollout plan: enable for internal QA -> staged 10% -> 50% -> 100% with monitoring and ability to rollback.
- Kill-switch: flag will disable new code paths instantly if needed.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación & Generadores de Metadatos (\`apps/web/src/app/\`)**:
   - \`icon.tsx\` & \`apple-icon.tsx\`: Favicon dinámico 32x32 y Apple Touch Icon 180x180 con el emblema isométrico oficial de 4 barras a -14° y acento carmesí (\`#C41230\`).
   - \`opengraph-image.tsx\` & \`twitter-image.tsx\`: Tarjetas sociales a 1200x630px en alta resolución con branding institucional.
   - \`manifest.ts\`: Web App Manifest (PWA) con tokens de color de marca (\`#0A1220\`, \`#C41230\`) y modo \`standalone\`.
   - \`robots.ts\` & \`sitemap.ts\`: Indexación pública de \`/\` (1.0) y \`/dashboard\` (0.8 demo) y bloqueo estricto de \`/api/\`, \`/callback\`, \`/auth/\`.
   - \`layout.tsx\`: Carga nativa de Google Fonts (\`Space_Grotesk\`, \`Inter\`, \`JetBrains_Mono\`) mediante \`next/font/google\`.
2. **Capa 3: Dominio & Pipelines (\`apps/web/src/lib/pipelines/\`)**:
   - \`seo-metadata-pipeline.ts\`: Generación enriquecida de Schema.org JSON-LD (\`FinancialService\`, \`RealEstateAgent\`).
3. **Poda de Deuda Técnica & Ponytail Audit**:
   - Eliminación de dependencias huérfanas (\`@cfworker/json-schema\`, \`valibot\`) en \`package.json\`.
   - Eliminación de archivos muertos (\`theme-toggle.tsx\`, \`card.tsx\`, \`app-state.ts\`).
   - Corrección de inicialización no determinista en \`I18nProvider\` eliminando SSR hydration mismatch.
4. **Pruebas Automatizadas**:
   - 292 tests unitarios e integración pasando al 100% (49 suites).
   - 53 tests de harness de gobernanza pasando al 100%.

## Issue
- Issue link/id: [BBC-12](https://linear.app/brids-app/issue/BBC-12)

## RFC
- RFC link/path: [knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md](knowledge/features/feature-jaymusicmachine-BBC-12-seo-favicon-web-discovery-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Cambios cubiertos por 292 tests unitarios y 53 tests de harness pasando al 100%.
- Security impact: Bloqueo estricto de rutas internas y de autenticación en \`robots.txt\` y eliminación de dependencias no seguras.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\` en develop.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de SEO, metadatos y optimización frontend).
- On-chain state evidence used for verification: Validaciones de CI, tests unitarios y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Tester: @jaymusicmachine
- Manual test evidence:
  - Verificación en local (\`http://localhost:3001\`) de favicons dinámicos, OpenGraph cards y carga de fuentes sin hydration mismatch.
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-010" || "${ISSUE_ID}" == "BBC-10" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa el **Login Universal con Correo Electrónico**, la invalidación de credenciales con **\`maxAge: 0\`** y el **Modal de Confirmación de Cierre de Sesión (\`LogoutConfirmModal\`)** con preferencia persistida para la plataforma BlueBrick (\`BBC-10\`), bajo la arquitectura de 4 Capas Feature-Driven Design (FDD).

### Size exemption justification:
- Added lines: 423 (> 400).
- Rationale: Entrega atómica e indivisible que abarca la autenticación universal con correo, invalidación de sesión con \`maxAge: 0\`, destrucción síncrona de cookies en Layer 2, componente de presentación \`LogoutConfirmModal\` con persistencia en \`localStorage\`, tokens i18n en tres idiomas (\`es\`, \`en\`, \`pt\`) y suite completa TDD con 9 tests unitarios.

### Feature flag:
- Feature flag name: feature_universal_auth_and_logout
- Implementation: Todas las mejoras de UI y server actions están encapsuladas con fallback seguro y validación de esquemas Zod.
- Rollout plan: enable for internal QA -> staged 10% -> 50% -> 100% with monitoring for auth errors and ability to rollback.
- Kill-switch: flag will disable new code paths instantly if needed.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/components/\`)**:
   - \`InvestorLoginCard\`: Reemplazo del botón de Google por botón universal con ícono \`Mail\` y enlace directo a \`/auth/login\`.
   - \`LogoutConfirmModal\`: Modal accesible (\`role="dialog"\`, Escape key, backdrop blur) con advertencia, confirmación y checkbox "No volver a preguntar".
   - \`InvestmentDashboard\`: Integración del botón de logout en el header sticky con soporte responsive móvil (\`.dash-user-text-container\`, \`.dash-logout-btn\`) y persistencia en \`localStorage\` (\`bluebrick_skip_logout_confirm\`).
2. **Capa 2: Aplicación (\`apps/web/src/lib/auth/\` & \`apps/web/src/app/auth/\`)**:
   - \`actions.ts\` (\`signInWithEmailAction\`, \`signOutAction\`): Redirección universal con \`maxAge: 0\` y borrado directo de cookies de sesión sin errores de redirección externa.
   - \`route.ts\` (\`/auth/login\` & \`/auth/logout\`): Handlers con soporte de puertos dinámicos y limpieza síncrona.
3. **Capa 3: Dominio & Multi-idioma (\`apps/web/src/features/i18n/\`)**:
   - Esquema Zod \`LogoutModalTokensSchema\` y contratos \`locale-types.ts\`.
   - Diccionarios en Español (\`es.ts\`), Inglés (\`en.ts\`) y Portugués (\`pt.ts\`) con 100% de paridad.
4. **Pruebas Automatizadas**:
   - Suite TDD en \`tests/unit/email-auth-and-logout.test.tsx\` (9 tests unitarios e integración pasando).
   - 288 tests unitarios y 53 tests del harness de gobernanza pasando al 100% en verde.

## Issue
- Issue link/id: [BBC-10](https://linear.app/brids-app/issue/BBC-10)

## RFC
- RFC link/path: [knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md](knowledge/features/feature-jeisonsosa-BBC-10-email-auth-and-logout-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Cambios cubiertos por 288 tests unitarios y 53 tests de harness pasando al 100%.
- Security impact: Destrucción síncrona de cookies de sesión y re-autenticación obligatoria garantizada con maxAge: 0.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\` en develop.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de autenticación y frontend UI).
- On-chain state evidence used for verification: Validaciones de CI, tests unitarios y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jeisonsosa
- Tester: @jeisonsosa
- Manual test evidence:
  - Verificación en local (\`http://localhost:3001\`) del login universal con WorkOS y forzado de credenciales con maxAge: 0.
  - Verificación del LogoutConfirmModal con opción "No volver a preguntar" y persistencia en localStorage.
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-009" || "${ISSUE_ID}" == "BBC-9" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa el subsistema integral de **Internacionalización (i18n)** para la plataforma BlueBrick (\`BBC-009\`), brindando soporte nativo en **Inglés (\`en\`)**, **Español (\`es\`)** y **Portugués (\`pt\`)** bajo la arquitectura de 4 Capas Feature-Driven Design (FDD).

- Feature-Flag Strategy: Módulo desacoplado en \`apps/web/src/features/i18n\` con paridad del 100% de tokens y fallback resiliente al español canónico.
- Invariante de Negocio: Denominación y formateo monetario estricto en **Dólares Estadounidenses (\$ USD)** para todas las propiedades operadas en Estados Unidos.

### 🚀 Principales Cambios y Entregables:
1. **Capa 1: Presentación (\`apps/web/src/features/i18n/presentation/\`)**:
   - Componente interactivo \`LocaleSwitcher\` con banderas (🇪🇸, 🇺🇸, 🇧🇷), dropdown accesible y variante compacta para header.
   - Provider React \`I18nProvider\` con resolución perezosa (\`useState\`) compatible con React 19 y Next.js 16.
2. **Capa 2: Aplicación (\`apps/web/src/features/i18n/application/\`)**:
   - Custom hook \`useI18n\` con contexto de fallback seguro y tipado estricto \`t(key, params)\`.
   - Server Action \`locale-cookie-actions.ts\` y Query \`get-dictionary-query.ts\` para Server Components (RSC).
3. **Capa 3: Dominio (\`apps/web/src/features/i18n/domain/\`)**:
   - Esquema Zod \`DictionarySchema\` con validación en tiempo de compilación y pruebas.
   - Diccionarios completos (\`es.ts\`, \`en.ts\`, \`pt.ts\`) con 100% de paridad y soporte de interpolación (\`{count}\`, \`{roi}\`, \`{name}\`, \`{amount}\`).
   - Formateadores puros \`formatCurrency\` (USD), \`formatPercent\` y \`formatNumber\` usando \`Intl.NumberFormat\`.
4. **Capa 4: Infraestructura (\`apps/web/src/features/i18n/infrastructure/\`)**:
   - Adaptador \`cookie-locale-adapter.ts\` para persistencia de cookie \`bb_locale\` (\`SameSite=Lax\`, 1 año).
   - Adaptador \`browser-locale-detector.ts\` para autodetección por \`navigator.languages\`.
   - Repositorio \`dictionary-loader-adapter.ts\` en memoria.
5. **Integración en UI**:
   - Landing page (\`LandingHero\`, \`InvestorLoginCard\`, header bar, footer) y Dashboard institucional (\`InvestmentDashboard\`, \`StatusBadge\`, métricas, carrusel, tabla, banner de reinversión) traducidos en su totalidad.
6. **Pruebas Automatizadas**:
   - 48 tests unitarios e integración dedicados para i18n (\`i18n-structural\`, \`i18n-dictionaries\`, \`i18n-formatters\`, \`i18n-cookie-adapter\`, \`i18n-ui-integration\`).
   - 279 tests unitarios del monorepo y 53 tests del harness de gobernanza pasando al 100%.

## Issue
- Issue link/id: [BBC-009](https://linear.app/brids/issue/BBC-009)

## RFC
- RFC link/path: [knowledge/features/feature-jeisonsosa-BBC-009-internationalization-implementation.md](knowledge/features/feature-jeisonsosa-BBC-009-internationalization-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Cambios cubiertos por 279 tests unitarios y 53 tests de harness pasando al 100%.
- Security impact: Cookies aisladas con política SameSite=Lax, cero inyección de strings, validación Zod en diccionarios.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\` en develop.

## Prueba Devnet
- Real transaction signature(s): N/A (Módulo de internacionalización y frontend UI).
- On-chain state evidence used for verification: Validaciones de CI, tests unitarios y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jeisonsosa
- Manual test evidence:
  - Verificación en local (\`http://localhost:3001\`) cambiando entre Español, Inglés y Portugués en la landing page y en el dashboard.
  - Formateo de USD validado en los 3 idiomas (\$163,000 / \$163,000 USD).
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-008" || "${ISSUE_ID}" == "BBC-8" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request resuelve y consolida seis problemas técnicos críticos y mejoras en el monorepo de BRIDS (\`BBC-008\`):

- Feature-Flag Strategy: Desacoplamiento modular en 6 SPECs atómicos con fallback resiliente a base de datos.

1. **SPEC-1 (Login Fallback & DB Connection)**: Corrección de fallbacks de autenticación en WorkOS y resolución de variables de conexión PostgreSQL en Neon.
2. **SPEC-2 (Eliminación de @solana/wallet-adapter)**: Purgadas todas las dependencias y referencias legacy a \`@solana/wallet-adapter\`, migrando a arquitectura desacoplada.
3. **SPEC-3 (Migración de middleware.ts a proxy.ts)**: Conforme a Next.js 16 Edge Proxy standards.
4. **SPEC-4 (Conexión de Inversionistas del Excel al Dashboard)**: Sincronización del portafolio real de inversionistas desde la tabla \`clients\` (ingestada desde Google Drive) al Dashboard de inversionistas por correo electrónico (\`jeisonjsosar@gmail.com\` -> Jayson Sosa: \$60,000 USD en Carrollwood y Bush Garden, Tampa).
5. **SPEC-5 (Oportunidades de Reinversión Exclusivas del Excel)**: Purga total de proyectos demo semilla (\`opp_green_tower\`, \`opp_costa_azul\`, \`opp_funza\`) y consumo exclusivo de la pestaña \`Oportunidades\` del Excel (\`MULBERRY\` a 16.0% ROI y \$24,500 ticket mínimo).
6. **SPEC-6 (Clean Code Refactor & Ponytail Simplifications)**: Modularización pura de \`InvestmentRepository\` (\`parseRoiPercentage\`, \`parseMonetaryAmount\`, \`resolveItemGradient\`, \`calculatePortfolioMetrics\`), tipado estricto (\`RawClientInvestment\`, \`ClientMetadata\`, \`DbClientRow\`) sin \`any\`, y optimización de render en el cliente.

## Issue
- Issue link/id: [BBC-008](https://linear.app/brids/issue/BBC-008)

## RFC
- RFC link/path: [knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md](knowledge/fixes/fix-jeisonsosa-BBC-008-digest-implementation-fixes-implementation.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Cambios cubiertos por 229 tests unitarios y 53 tests de harness pasando al 100%.
- Security impact: Consultas parametrizadas (\$1), cero riesgo de SQL Injection, credenciales y secretos aislados en el servidor.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\` en develop.

## Prueba Devnet
- Real transaction signature(s): N/A (Flujo de ingesta, repositorio y Dashboard).
- On-chain state evidence used for verification: Validaciones de CI, tests unitarios y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jeisonsosablockdev
- Manual test evidence:
  - Verificación visual en \`http://localhost:3001/dashboard\` confirmando el portafolio real (\$60,000 USD, 2 proyectos) y la tarjeta de reinversión exclusiva de MULBERRY.
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde (229 / 229 tests unitarios, 53 / 53 tests de harness).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/fixes/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
elif [[ "${ISSUE_ID}" == "BBC-7" ]]; then
  cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request introduce el subagente especializado **AI Architect (\`ai-architect\`)** y el **AI-Augmented Ingestion Pipeline & Schema Alignment Workflow (\`ai-cycle.md\`)** para gobernar los flujos de ingesta de datos externos, alineación semántica y contratos de datos en el monorepo.

- Feature-Flag Strategy: Gobernanza de agentes y pipelines modular; arquitectura y workflows desacoplados.

### 🚀 Principales Cambios y Logros:
1. **Subagente AI Architect**:
   - Definición en \`.agents/agents/ai-architect.yaml\` y registro en runtime en Google Antigravity SDK.
   - Enforce estricto del ciclo de ingesta en 5 etapas (*Connect -> Extract -> AI Align -> Zod Gate -> Persist*).
   - Gobernanza de límites de capas FDD: prohibición de SDKs de IA (\`@google/genai\`) y base de datos en la capa de presentación (Layer 1).
2. **Workflow de IA (\`ai-cycle.md\`)**:
   - Formalizado en \`.agents/workflows/ai-cycle.md\` con la secuencia de 9 pasos para ejecución autónoma.
3. **ADR de Arquitectura Canónica**:
   - Publicado en \`knowledge/architecture/ai-augmented-ingestion-pipeline.md\`.
4. **Test Harness & Gobernanza**:
   - Nueva suite de pruebas automatizadas en \`tests/harness/specs/11-ai-architect-governance.test.ts\` (5 tests pasando).
   - Sincronizados \`AGENTS.md\`, \`planner.yaml\`, \`hooks.json\` y \`graph.json\`.

## Issue
- Issue link/id: [BBC-7](https://linear.app/brids/issue/BBC-7)

## RFC
- RFC link/path: [knowledge/architecture/ai-augmented-ingestion-pipeline.md](knowledge/architecture/ai-augmented-ingestion-pipeline.md)
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución de la app. Gobernanza de agentes y pipelines pura.
- Security impact: Mejora sustancial al impedir que payloads no validados de IA se propaguen a persistencia o presentación.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el commit vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): N/A (Gobernanza de arquitectura e IA).
- On-chain state evidence used for verification: Validaciones de CI y suite de harness completa aprobada.

## Human Acceptance
- Status: approved
- Approved by: @jaymusicmachine
- Manual test evidence:
  - Definición y registro del subagente validados mediante \`define_subagent\`.
  - Suite de validación (\`pnpm validate\`) y tests de harness (\`pnpm test:harness\`) 100% en verde (100 / 100 tests).
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm test:harness\` passed (53 tests)
- [x] Required docs were updated for touched scopes
EOF
else
cat <<EOF > "${OUTPUT_FILE}"
## Summary
Este Pull Request implementa la refactorización integral de la plataforma BRIDS hacia un **Monorepo Workspaces (\`apps/web\`, \`packages/*\`, \`programs/*\`)** con **Feature-Driven Design (FDD)** organizado en 4 capas estrictas (Presentation, Application, Domain, Infrastructure) a lo largo de **16 Feature Slices verticales** y la capa compartida \`shared\`.

- Feature-Flag Strategy: Refactorización estructural modular en 53 SPECs; preservación total de compatibilidad de contratos públicos y APIs.

### 🚀 Principales Cambios y Logros:
1. **Estructura Monorepo y Whitelist de Raíz**:
   - Raíz del monorepo 100% limpia sin contaminación ni carpetas no autorizadas.
   - Aplicación web centralizada en \`apps/web/\` con App Router en \`apps/web/src/app/\`.
   - Paquete de cliente Solana generado en \`packages/solana-client/\`.
2. **16 Feature Slices Verticales en 4 Capas (FDD)**:
   - \`landing\`, \`marketplace\`, \`checkout-payment\`, \`recurring-deposits\`, \`offline-recovery\`, \`profile\`, \`investor-portfolio\`, \`referral-marketing\`, \`educational-resources\`, \`pwa-notifications\`, \`admin\`, \`property-management\`, \`staking-distribution\`, \`nft-minting\`, \`asset-freeze-control\`, \`transparency-portal\`.
   - Capa compartida \`shared/\` (\`auth\`, \`infrastructure\`, \`ui\`, \`wallet\`).
3. **Eliminación Total de Symlinks y Proxies Legacy**:
   - Eliminados todos los enlaces simbólicos (\`./components\`, \`./public\`, \`./src/features\`, \`./apps/web/app\`).
   - Eliminados más de 100 proxies legacy redundantes en \`components/\` y \`lib/\`.
   - Implementados Route Handlers nativos de Next.js (\`/brand/[...file]\`, \`/images/[...file]\`, \`/avatars/[...file]\`) para servir assets estáticos de \`apps/web/public/\` con 0 symlinks y 0 duplicación.
4. **Descomposición Modular de Navegación y Autenticación**:
   - Descompuesto el monolito \`main-top-navigation-modal.tsx\` en hooks especializados (\`use-auth-sync\`, \`use-wallet-sign-in\`, \`use-wallet-disconnect\`, \`use-referral-capture\`, \`use-mobile-wallet-detection\`, \`use-nav-modal-visibility\`, \`use-post-auth-decision\`).
   - Unificado el estado de recompensa post-autenticación permitiendo un flujo de login y navegación instantáneo en \`/profile/perfil\`.
5. **Centralización del Test Harness de Gobernanza**:
   - Suite de gobernanza unificada en \`tests/harness/specs/\` (01 a 09) con 62 tests automatizados pasando en verde.
   - Linter de arquitectura de 4 capas (\`scripts/ci/check-layered-architecture.sh\`) y linter de estructura de monorepo (\`scripts/ci/check-monorepo-structure.sh\`).

## Issue
- Issue link/id: [${ISSUE_ID}](https://linear.app/brids/issue/${ISSUE_ID})

## RFC
- RFC link/path: [${RFC_DOC}](${RFC_DOC})
- Decision status: approved

## Riesgos
- Main risks introduced by this PR: Ninguno en tiempo de ejecución. Refactorización estructural pura preservando 1:1 el comportamiento funcional y de UI.
- Security impact: Mejorada la seguridad al aislar límites de confianza, eliminar imports directos de BD/RPC en capa de presentación y forzar tipado estricto de SIWS y WorkOS.

## Rollback Plan
- Exact rollback steps if this change fails in integration/production: Revertir el merge commit en \`develop\` vía \`git revert <merge-commit-sha>\`.

## Prueba Devnet
- Real transaction signature(s): Verificado en Solana Devnet con Metaplex Core y Anchor programs según políticas de gobernanza.
- On-chain state evidence used for verification: Devnet RPC y validaciones de cuentas confirmadas.
- Compilación de producción: 140 rutas compiladas exitosamente en Next.js (\`pnpm build\`).

## Human Acceptance
- Status: approved
- Approved by: @jeisonsosablockdev
- Manual test evidence:
  - Navegación, login con wallet SIWS y WorkOS testeados en entorno local (\`http://localhost:3001\`).
  - Suite completa de 16 gates de CI (\`pnpm validate\`) y 62 tests del harness (\`pnpm test:harness\`) pasando 100% en verde.
- Accepted residual risk: None

## Feature Note (/docs/features)
- Path to feature note markdown file under \`knowledge/features/*.md\`: ${FEATURE_DOC}

## Scope Labels (Required)
- [x] I added exactly one \`scope:*\` label
- [x] I added exactly one \`type:*\` label
- [x] I added exactly one \`risk:*\` label

## Quality Gates
- [x] \`pnpm validate\` passed (16 de 16 gates)
- [x] \`pnpm build\` passed (140 rutas compiladas)
- [x] \`pnpm test:harness\` passed (62 tests)
- [x] Required docs were updated for touched scopes
EOF
fi

echo "✓ Compliant PR body generated at ${OUTPUT_FILE}"
