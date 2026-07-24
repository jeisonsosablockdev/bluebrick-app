---
type: Fix Spec
title: Fix BRI- 170 Stake Mobile Card Overflow Implementation
description: Fix BRI- 170 Stake Mobile Card Overflow Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-bri-170-stake-mobile-card-overflow-implementation.md
---

# implementation(fix): BRI-170 Stake mobile card overflow

## Espanol

## Slices

### S01 - Artefacto

Estado: completado.

Decision:

- El contenido blockchain largo se trata como input no confiable para layout.
- El fix se limita a contencion responsive, no cambia semantica de Stake / Unstake.

### S02 - UI responsive

Estado: completado.

Cambios aplicados:

- Agregar `min-w-0` al contenedor principal y al contenedor textual del card.
- Agregar wrapping fuerte a `assetAddress`.
- Mantener el header del card apilado en mobile para que el badge no compita horizontalmente con textos largos.
- Evitar que el badge de estado provoque overflow con `self-start` y `max-w-full`.
- Agregar wrapping a la direccion en el modal.
- Ajustar `ProtectedShell` para que la columna de contenido use `minmax(0, 1fr)`, `min-w-0` y permita shrink real dentro del grid.
- Limitar `StakeModule` en mobile a `max-w-[calc(100vw-2rem)]` y reforzar `w-full/max-w-full` en grid, cards y botones.

### S03 - Pruebas y cierre

Estado: completado.

Validacion:

- `npx vitest run tests/components/stake-module.test.ts` - passed, 1 file / 7 tests.
- `npx playwright test e2e/protected-stake.responsive.pw.spec.ts --project=playwright-smoke` - passed, 1 test; evidencia 320, 375, 640, 700, 768 y 1024 sin overflow horizontal ni bounding boxes fuera del viewport.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.

Notas QA:

- La prueba Playwright intercepta solo `/api/protected/stake/assets` para forzar tres NFTs elegibles con `assetAddress`, `propertyTitle`, `displayName`, `ready_to_unstake` y `ready_to_stake`, reproduciendo la lista de cards observada en mobile.
- La prueba mantiene SIWS real de usuario local antes de entrar a `/protected/stake`; no cambia el contrato de autenticacion, API, estado on-chain ni persistencia.
- Criterio responsive: `document.documentElement.scrollWidth <= window.innerWidth` y `card/button boundingBox.x + width <= viewportWidth` en cada ancho requerido.

Clean-code:

- Auditoria final completada con el skill `clean-code`.
- Hallazgo menor corregido: el test unitario de identificadores largos usaba un literal corto (`Asset111`); se reemplazo por una constante base58 larga para que el test refleje el riesgo real.
- Sin hallazgos bloqueantes pendientes.

## English

## Slices

### S01 - Artifact

Status: completed.

Decision:

- Long blockchain content is treated as layout-untrusted input.
- The fix is limited to responsive containment and does not change Stake / Unstake semantics.

### S02 - Responsive UI

Status: completed.

Applied changes:

- Add `min-w-0` to the root container and card text container.
- Add strong wrapping to `assetAddress`.
- Keep the card header stacked on mobile so the badge does not compete horizontally with long text.
- Prevent the status badge from causing overflow with `self-start` and `max-w-full`.
- Add wrapping to the address in the confirmation modal.
- Adjust `ProtectedShell` so the content column uses `minmax(0, 1fr)`, `min-w-0`, and can actually shrink inside the grid.
- Limit `StakeModule` on mobile to `max-w-[calc(100vw-2rem)]` and reinforce `w-full/max-w-full` on the grid, cards, and buttons.

### S03 - Tests and closeout

Status: completed.

Validation:

- `npx vitest run tests/components/stake-module.test.ts` - passed, 1 file / 7 tests.
- `npx playwright test e2e/protected-stake.responsive.pw.spec.ts --project=playwright-smoke` - passed, 1 test; 320, 375, 640, 700, 768, and 1024 evidence with no horizontal overflow and no card/button bounding boxes outside the viewport.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.

QA notes:

- The Playwright test intercepts only `/api/protected/stake/assets` to force three eligible NFTs with `assetAddress`, `propertyTitle`, `displayName`, `ready_to_unstake`, and `ready_to_stake`, reproducing the mobile card list that exposed the bug.
- The test keeps real local user SIWS before entering `/protected/stake`; it does not change the authentication contract, API, on-chain state, or persistence.
- Responsive criterion: `document.documentElement.scrollWidth <= window.innerWidth` and `card/button boundingBox.x + width <= viewportWidth` at each required width.

Clean code:

- Final audit completed with the `clean-code` skill.
- Minor finding fixed: the unit test for long identifiers used a short literal (`Asset111`); it now uses a long base58 constant so the test reflects the real risk.
- No unresolved blocking findings.
