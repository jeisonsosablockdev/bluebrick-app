# Fix: BRI-158 Public SEO + Core Web Vitals + Vercel Performance Implementation

Last Updated: 2026-05-19 UTC
Status: completed
Owner: frontend platform
Artifact Type: solution

## Summary

Este artefacto deja cerrada la ejecución del fix de performance/SEO público y documenta tanto el plan como el resultado final.

El artefacto de problema asociado vive en:

- `knowledge/fixes/fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158.md`

## Objective

Corregir la estrategia de carga inicial pública de BRIDS para que la superficie de discovery/marketing aproveche mejor Next.js App Router y Vercel sin romper:

- SEO técnico existente
- auth/wallet cuando el usuario sí lo necesita
- responsive behavior
- contratos públicos actuales

## Final Outcome

Resultado confirmado el `2026-05-19`:

- `app/layout.tsx` volvió a ser un shell público estático:
  - sin `getServerLocale()`
  - sin splash global bloqueante
  - con analytics encapsulado en `Suspense`
- el runtime global de wallet dejó de contaminar el layout raíz:
  - `app/providers.tsx` conserva solo locale
  - Solana wallet runtime vive ahora en `components/wallet/wallet-runtime-provider.tsx`
- las rutas públicas críticas recuperaron estático/ISR:
  - `/`
  - `/about`
  - `/knowledge`
  - `/knowledge/faq`
  - `/platform`
  - `/software`
  - `/regulatory`
  - `/transparencia`
- `/marketplace` y `/marketplace/[id]` permanecen dinámicas por decisión explícita:
  - la primera sigue atada a `searchParams` de filtros
  - la segunda sigue resolviendo detalle anónimo bajo SSR
- el home dejó de depender de fetch cliente above-the-fold para el total del marketplace
- `/properties` y `/properties/[id]` ya exponen `cache-control` apto para Vercel CDN
- Vercel Speed Insights quedó integrado en el layout
- el sitio ya publica `opengraph-image` y `twitter-image` estáticos del sistema

## Slice Results

### Slice 1: Public Rendering Boundary

Completado.

- locale público resuelto desde cliente con fallback seguro
- auth snapshot público diferido a intención de uso del modal
- boundaries con `Suspense` donde `useSearchParams()` debía dejar de bloquear prerender

### Slice 2: Global Runtime Reduction

Completado.

- wallet providers salieron del root layout
- PWA runtime quedó fuera del shell global y solo se monta donde aplica

### Slice 3: Hero, Splash, And Above-The-Fold Stability

Completado.

- splash global eliminado del shell raíz
- `HeroSection` ahora recibe `marketplaceTotal` desde render server
- hero image mantiene `priority` y suma `sizes` explícito para mejor LCP

### Slice 4: Public Data Caching

Completado.

- `/properties`: `public, s-maxage=300, stale-while-revalidate=600`
- `/properties/[id]`: `public, s-maxage=60, stale-while-revalidate=300`
- grid cliente dejó de forzar `no-store` en el detalle

### Slice 5: Measurement And Closeout

Completado.

- `@vercel/speed-insights` instalado e integrado
- `opengraph-image` y `twitter-image` añadidos
- tests nuevos para headers de caché pública
- `npm run build` y `npm run validate` en verde

### Post-QA Runtime Hardening

Completado en la rama hija:

- form controls públicos endurecidos con `suppressHydrationWarning` para neutralizar atributos transitorios inyectados antes de hidratar
- mark SVG del wallet header ajustado para eliminar warning de aspect-ratio en `next/image`
- charts del marketplace montados después del primer `requestAnimationFrame` con skeleton inicial para evitar mediciones `width(-1)/height(-1)` en Recharts
- primera imagen del marketplace marcada como eager para responder mejor al hint de LCP del viewport inicial

Resultado verificado:

- sin hydration mismatch warnings en la pasada dev de `/transparencia`
- sin warnings de Recharts en la pasada dev de `/marketplace`
- sin warning del mark SVG en `WalletModal`

## Slice 0 Baseline

Baseline capturado el `2026-05-19` sobre la rama:

- `public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158`

### Build Rendering Snapshot

Resultado actual de `npm run build`:

- las rutas públicas críticas siguen saliendo como dinámicas (`ƒ`)
- entre ellas:
  - `/`
  - `/about`
  - `/knowledge`
  - `/knowledge/faq`
  - `/knowledge/articles/[slug]`
  - `/knowledge/definitions/[slug]`
  - `/platform`
  - `/software`
  - `/regulatory`
  - `/transparencia`
  - `/marketplace`
  - `/marketplace/[id]`

Rutas públicas que sí salen estáticas hoy:

- `/manifest.webmanifest`
- `/robots.txt`
- `/sitemap.xml`
- feeds exportables (`/feeds/*`)

### Public Shell Findings

Hallazgos estructurales actuales:

1. `app/layout.tsx` monta `ClientAnalytics`, `AppSplashScreen` y `AppProviders` para toda la app.
2. `app/layout.tsx` además resuelve locale vía `getServerLocale()`.
3. `AppProviders` monta globalmente:
   - `LocaleProvider`
   - `PwaClientRuntime`
   - `ConnectionProvider`
   - `WalletProvider`
   - `WalletModalProvider`
4. Varias rutas públicas montan `WalletModal` directamente:
   - `/`
   - `/marketplace`
   - `/marketplace/[id]`
   - `/transparencia`
   - `/checkout`
5. El splash global espera `window.load` antes de retirarse.
6. El hero del home hace fetch cliente adicional a `/properties` para mostrar el total de marketplace.

### Current Dynamic Triggers Observed

Triggers principales detectados en la superficie pública:

1. lectura de `cookies()` / `headers()` para locale y auth inicial
2. `searchParams` server-side en marketplace
3. runtime global de wallet/PWA en el layout compartido
4. componentes cliente de alto peso en la capa above-the-fold pública

### Current Cache Findings

Estado actual relevante para Vercel:

1. endpoints machine-readable (`ai.txt`, `knowledge.json`, `definitions`, `entities`, feeds) ya tienen `s-maxage` + `stale-while-revalidate`
2. `/properties` no expone hoy una política explícita de caché pública
3. los datos públicos usados por hero/marketplace no siguen todavía una estrategia formal de cacheabilidad para Vercel CDN

### First Implementation Slice Locked

Con este baseline, el primer slice técnico queda fijado así:

- **Slice 1: Public Rendering Boundary**

Orden de ejecución posterior:

1. recuperar un boundary público menos dinámico
2. recién después recortar runtime global
3. después atacar splash/above-the-fold
4. luego cerrar cache headers y medición

## Implementation Principles

Las decisiones de implementación se regirán por estos principios:

1. Public shell first
- primero optimizamos el shell y rendering público
- no empezamos por micro-optimizaciones cosméticas

2. Static/ISR by default for public discovery
- una ruta pública solo debe quedar dinámica si existe una razón material

3. Auth/wallet by intent, not by default
- no cargamos runtime de wallet/auth global en rutas públicas si el usuario todavía no lo pidió

4. Measured change, not performance folklore
- cada cambio debe justificarse con impacto en:
  - route rendering mode
  - JS global
  - caché HTTP/CDN
  - evidence in browser/Vercel

5. No implementation before docs gates
- el código empieza solo después de que este documento deje cerradas las decisiones materiales

## Gitflow

## Mother Branch

- branch actual:
  - `public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158`

## Branching Model

Para este fix usaremos una sola mother branch inicialmente.

No abriremos stacked branches de entrada.

Solo se permitirán slices separadas si durante la implementación aparecen write scopes claramente independientes. La expectativa inicial es mantenerlo en una sola rama para reducir overhead de integración.

## Commit Policy

Todos los commits deben cumplir el patrón canónico del repo:

- `fix(app): ...`
- `fix(shared): ...`
- `docs(docs): ...`
- `test(app): ...`

Preferencia:

1. un commit documental inicial
2. commits atómicos por slice técnico
3. un commit final de QA/docs si hace falta

## Pull Request Strategy

PR único contra `develop`, con:

- `issue`
- `rfc`
- `riesgos`
- `rollback plan`
- `prueba devnet`

Nota:
- `prueba devnet` debe explicitar “not applicable” si no hay cambio blockchain, pero la sección sigue siendo obligatoria por policy del repo.

## Workflow Activation

Este fix activa:

- `.codex/workflows/frontend-cycle.md`
- `.codex/workflows/responsive-qa.md`

Participantes esperados:

- `planner`
- `frontend`
- `qa`
- `docs`
- `reviewer`
- `security`

`security` se mantiene dentro del loop porque el trabajo toca auth/wallet trust boundary, aunque el foco principal sea performance.

## Route Strategy Decision

La estrategia objetivo por familias de rutas queda así:

### Public discovery routes

Deben tender a `static` o `ISR`:

- `/`
- `/about`
- `/platform`
- `/software`
- `/regulatory`
- `/transparencia`
- `/knowledge`
- `/knowledge/*`
- `/resources/*`

### Marketplace routes

Deben revisarse explícitamente:

- `/marketplace`
- `/marketplace/[id]`

Objetivo:

- mantener SSR solo si el dato realmente lo exige
- preferir caché controlada o ISR si el dato es anónimo y tolera frescura acotada

### Protected/admin routes

No forman parte del objetivo principal de esta optimización, salvo cuando su runtime esté contaminando el shell público.

## Solution Slices

## Slice 0: Documentation + Baseline

Objetivo:

- cerrar artefactos
- fijar plan
- tomar baseline de rendering y build output

Entrega:

- artifact pair de fix
- mapa inicial de rutas públicas y su modo (`○` vs `ƒ`)
- inventario de dependencias globales que afectan el shell público

## Slice 1: Public Rendering Boundary

Objetivo:

- sacar del root public path cualquier dependencia de request-time APIs que dinamice rutas públicas sin necesidad

Incluye:

- revisar resolución de locale en layout público
- separar layout público de layout con comportamiento dependiente de request/cookie si aplica
- recuperar static/ISR para rutas públicas elegibles

No acceptable if:

- seguimos con la mayoría de rutas públicas en `ƒ` por una dependencia evitable

## Slice 2: Global Runtime Reduction

Objetivo:

- dejar de montar wallet/auth/PWA runtime en toda la superficie pública

Incluye:

- mover providers pesados fuera del shell público global
- cargar wallet/auth por intención o en superficies que realmente lo necesiten
- revisar analytics globales para que no añadan costo innecesario al primer render

No acceptable if:

- el shell público sigue cargando runtime de wallet por defecto

## Slice 3: Hero, Splash, And Above-The-Fold Stability

Objetivo:

- eliminar bloqueos o shifts evitables en el primer viewport

Incluye:

- decidir destino del splash global
- eliminar fetch cliente above-the-fold que no sea imprescindible
- asegurar que banner/hero no introduzcan CLS por hidratación tardía

No acceptable if:

- el contenido visible sigue esperando overlays o inserciones cliente para sentirse “cargado”

## Slice 4: Public Data Caching

Objetivo:

- volver cacheables los endpoints y lecturas públicas anónimas que hoy no aprovechan Vercel CDN

Incluye:

- revisar `/properties` y endpoints equivalentes
- decidir `cache-control`, `s-maxage`, `stale-while-revalidate`
- asegurar consistencia con los datos que se pintan en home/marketplace

No acceptable if:

- la estrategia de datos públicos sigue obligando roundtrips frescos donde no hacen falta

## Slice 5: Measurement And Closeout

Objetivo:

- dejar medición y evidencia verificable

Incluye:

- integrar Vercel Speed Insights si falta
- validar CWV/TTFB por ruta crítica
- documentar resultado y riesgos residuales

No acceptable if:

- cerramos el fix sin una forma clara de medir impacto real

## Tests First Contract

Antes de implementación de cada slice, debemos agregar o ajustar tests que fallen por la condición actual cuando eso sea viable.

Orden esperado:

1. tests de rendering/caching contracts
2. tests de shell boundaries
3. tests/guards de metadata/SEO si cambia la estrategia
4. browser verification

Tipos de pruebas esperadas:

- unit/contract tests para:
  - route rendering assumptions cuando aplique
  - metadata/SEO invariants
  - public endpoint cache headers
  - shell/provider boundaries
- `npm run build` como evidencia estructural obligatoria
- Playwright/manual browser evidence para rutas públicas críticas

## Tooling Plan

Usaremos estas herramientas:

### Shell

- `rg`
- `git`
- `npm run build`
- `npm run validate`
- `curl` para inspección de headers/cache cuando aplique

### Browser

Usaremos el plugin/browser del entorno para:

- abrir rutas públicas críticas
- verificar above-the-fold
- revisar CLS perceptible
- revisar modales/banners/touch targets
- capturar evidence responsive en:
  - 320
  - 375
  - 768
  - 1024

### External Guidance

Solo usaremos fuentes primarias:

- Vercel docs
- Next.js docs
- web.dev

### Vercel-Specific Tools

Si durante la implementación necesitamos inspección adicional del proyecto/deploy, podremos usar capacidades del plugin Vercel disponible en la sesión, pero no es prerequisito para abrir el fix.

## Commands Expected During Implementation

Comandos base esperados:

- `npm run build`
- `npm run validate`
- `npm run pr:metadata`

Comandos de soporte según slice:

- búsquedas con `rg`
- inspección de headers con `curl`
- Playwright/browser evidence sobre localhost

## Documentation Updates Required Beyond This Artifact Pair

Si la implementación toca auth/wallet trust boundary o cookie strategy pública, deberán actualizarse también:

- `knowledge/auth-flow.md`
- `knowledge/session-model.md`

Si la implementación redefine la estrategia pública de SEO/performance a nivel sistémico, también debemos considerar actualización de:

- docs de EPIC-010 relacionadas
- cualquier guía canónica que hoy describa baseline de performance de forma incompleta

## Responsive QA Scope

Rutas mínimas a verificar:

- `/`
- `/marketplace`
- `/about`
- `/knowledge`

Checklist obligatorio:

- sin overflow horizontal
- touch targets >= 44px
- modales seguros en móvil
- banner/hero/splash sin regresiones visuales

## Evidence Required

Para cerrar el fix, reviewer debe recibir:

- salida relevante de `npm run build`
- resultado de `npm run validate`
- evidencia responsive en 320/375/768/1024
- notas de cache/rendering por ruta
- confirmación de métricas o baseline capturado en Vercel/browser
- lista de docs actualizados

## Additional QA Evidence

Evidencia adicional capturada en localhost:

- `npx playwright test e2e/critical-path.evidence.pw.spec.ts e2e/story-010-03-routes.responsive.pw.spec.ts --project=playwright-smoke`
- capturas responsivas extra en `320/375/768/1024` para:
  - `/`
  - `/marketplace`
  - `/transparencia`
- artefactos locales en:
  - `tmp/bri-158-responsive-evidence/`

## Risks

Riesgos principales:

1. romper locale resolution pública al intentar recuperar estático
2. degradar UX de wallet/auth por mover providers demasiado agresivamente
3. introducir inconsistencia entre home y marketplace por cambios de caché
4. optimizar TTFB a costa de frescura donde sí importa

## Rollback Plan

Si una slice introduce regresión:

1. revertir esa slice de forma atómica
2. mantener el resto del fix solo si no depende de ella
3. volver al shell/runtime previo si auth/wallet se ve afectado
4. conservar docs y baseline para reabrir la solución con mejor decisión

## Completion Gates

El fix solo se considera completo si pasa todo esto:

1. artifact pair presente y decision-complete
2. implementación hecha dentro de la mother branch del fix
3. `npm run build` exitoso
4. `npm run validate` exitoso
5. evidencia responsive completa
6. reviewer sin blocking findings
7. rutas públicas críticas con estrategia de rendering/carga mejor que la actual y evidencia concreta de ello

## Linear Sync

Cuando exista issue/BRI asociado, Linear debe reflejar:

- scope del fix
- slices
- riesgos
- evidencia final

Hasta entonces, este documento actúa como contrato fuente local de la iniciativa.
