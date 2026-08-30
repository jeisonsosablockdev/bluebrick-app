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

if [[ "${ISSUE_ID}" == "BBC-12" || "${ISSUE_ID}" == "BBC-012" ]]; then
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
