# Solution Spec: splash-fouc-order-fix Implementation (BBC-23)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

### Layer 1: Presentation Layer (`apps/web/src/app`, `apps/web/src/components/splash`)
- **`apps/web/src/app/layout.tsx`**:
  - Inyecta en el `<head>` un micro-script síncrono inline para pre-detección de sesión:
    ```html
    <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(sessionStorage.getItem("bluebrick_splash_viewed")==="true"){document.documentElement.classList.add("splash-bypassed");}}catch(e){}})();` }} />
    ```
  - Agrega reglas CSS globales o estilo crítico para `.splash-bypassed #brand-splash-curtain { display: none !important; }`.
- **`apps/web/src/components/splash/brand-splash-screen.tsx`**:
  - Incorpora el contenedor de cortina base `#brand-splash-curtain` (`fixed inset-0 z-[9999] bg-[#020813]`) directamente en el árbol de componentes (sin depender de `createPortal` tardío).
  - Al renderizar en SSR, la cortina `#020813` ya está presente en el HTML inicial.
  - Al hidratar en el cliente, si `phase === "completed"` o `isVisible === false`, la cortina se desmonta fluidamente junto con `AnimatePresence`.
- **`apps/web/src/app/providers.tsx`**:
  - Remueve el retardo del dynamic chunk de `BrandSplashScreen` o renderiza la cortina estática directamente en el árbol de proveedores para asegurar presencia en Frame 0.

### Layer 2: Application / Consumption Layer (`apps/web/src/components/splash`)
- **`apps/web/src/components/splash/use-splash-screen.ts`**:
  - Coordina el estado `phase` e `isVisible`.
  - En la fase de salida (`exiting` -> `completed`), notifica y asegura la remoción de cualquier clase o elemento residual de telón en el DOM.

### Layer 3: Domain / Pipelines Layer (`apps/web/src/lib/splash`)
- **`apps/web/src/lib/splash/load-optimizer.ts`**:
  - Mantiene las funciones de cálculo de schedule y bypass.
- **`apps/web/src/lib/splash/types.ts`**:
  - Define contratos para `SplashCurtainProps` o banderas de SSR-first mounting.

### Layer 4: Infrastructure Layer (`apps/web/src/lib/splash`)
- **`apps/web/src/lib/splash/splash-storage.ts`**:
  - Mantiene `sessionSplashStorage` con la clave `"bluebrick_splash_viewed"` sincronizada con el script de `<head>`.

## 3. Atomic Slices & Logical Sequence
- **SPEC-1: Zero-FOUC Shell Curtain & SSR Frame 0 Background** (`SPEC/jaymusicmachine-BBC-23-s01-splash-fouc-curtain`):
  - 1. **RED**: Diseñar pruebas unitarias en `tests/unit/splash-fouc-curtain.test.tsx` que verifiquen:
    - Presencia de la cortina con fondo `#020813` y `z-index: 9999` en el renderizado estático inicial (SSR/HTML).
    - Inyección del script de pre-detección de sesión en `<head>`.
    - Respeto de la clase `.splash-bypassed` para ocultar la cortina sin FOUC en visitas secundarias.
  - 2. **GREEN**: Implementar la cortina estática en `layout.tsx` / `providers.tsx` y sincronizarla con `BrandSplashScreen`.
  - 3. **REFACTOR**: Auditoría clean-code con `code-refactoring-refactor-clean` y verificación runtime con `next-dev-loop`.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Test File Path**: `tests/unit/splash-fouc-curtain.test.tsx`
- **Command**: `pnpm test tests/unit/splash-fouc-curtain.test.tsx`
- **Assertion Goals**:
  - Comprobar que el HTML generado contiene el elemento de cortina con `background: #020813` y `z-index: 9999`.
  - Comprobar que el script de detección en `<head>` busca `"bluebrick_splash_viewed"`.
  - Comprobar que el splash se desmonta tras la transición de salida sin dejar elementos huérfanos.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde) incluyendo `splash-fouc-curtain.test.tsx`.
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings (16 de 16 gates).
- [ ] Verificación en vivo en dev server confirmando que `http://localhost:3002` inicia en `#020813` en Frame 0.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [fix-jaymusicmachine-BBC-23-splash-fouc-order-fix.md](knowledge/fixes/fix-jaymusicmachine-BBC-23-splash-fouc-order-fix.md)
- **Solution Spec**: [fix-jaymusicmachine-BBC-23-splash-fouc-order-fix-implementation.md](knowledge/fixes/fix-jaymusicmachine-BBC-23-splash-fouc-order-fix-implementation.md)
- **Linear Issue**: [BBC-23](https://linear.app/brids-app/issue/BBC-23/fixsplash-startup-zero-fouc-curtain-and-loading-order-fix)

