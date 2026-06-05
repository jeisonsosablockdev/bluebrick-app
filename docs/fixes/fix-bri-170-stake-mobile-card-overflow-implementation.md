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
- Permitir que el header del card apile contenido en mobile si es necesario.
- Evitar que el badge de estado provoque overflow.
- Agregar wrapping a la direccion en el modal.

### S03 - Pruebas y cierre

Estado: completado.

Validacion:

- `npx vitest run tests/components/stake-module.test.ts` - passed, 1 file / 7 tests.
- `npx playwright test e2e/protected-stake.responsive.pw.spec.ts --project=playwright-smoke` - passed, 1 test; evidencia 320, 375, 768 y 1024 sin overflow horizontal.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.

Notas QA:

- La prueba Playwright intercepta solo `/api/protected/stake/assets` para forzar un NFT elegible con `assetAddress`, `propertyTitle` y `displayName` largos.
- La prueba mantiene SIWS real de usuario local antes de entrar a `/protected/stake`; no cambia el contrato de autenticacion, API, estado on-chain ni persistencia.
- Criterio responsive: `document.documentElement.scrollWidth <= window.innerWidth` en cada ancho requerido.

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
- Let the card header stack on mobile when needed.
- Prevent the status badge from causing overflow.
- Add wrapping to the address in the confirmation modal.

### S03 - Tests and closeout

Status: completed.

Validation:

- `npx vitest run tests/components/stake-module.test.ts` - passed, 1 file / 7 tests.
- `npx playwright test e2e/protected-stake.responsive.pw.spec.ts --project=playwright-smoke` - passed, 1 test; 320, 375, 768, and 1024 evidence with no horizontal overflow.
- `npm run lint` - passed.
- `npm run typecheck` - passed.
- `npm run validate` - passed.

QA notes:

- The Playwright test intercepts only `/api/protected/stake/assets` to force one eligible NFT with long `assetAddress`, `propertyTitle`, and `displayName`.
- The test keeps real local user SIWS before entering `/protected/stake`; it does not change the authentication contract, API, on-chain state, or persistence.
- Responsive criterion: `document.documentElement.scrollWidth <= window.innerWidth` at each required width.

Clean code:

- Final audit completed with the `clean-code` skill.
- Minor finding fixed: the unit test for long identifiers used a short literal (`Asset111`); it now uses a long base58 constant so the test reflects the real risk.
- No unresolved blocking findings.
