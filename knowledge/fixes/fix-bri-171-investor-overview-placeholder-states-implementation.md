# Fix BRI-171 Investor Overview Placeholder States Implementation

## Enfoque

Mantener el contrato real de `/api/protected/overview` y corregir solo la presentacion del `OverviewModule`:

- Formatear estados de perfil/compliance con etiquetas humanas.
- Evitar `unknown` visible.
- Mostrar distribuciones preparadas como "Not available yet" cuando no exista moneda/corrida disponible.
- Mantener los ceros reales solo cuando el origen esta definido y la metrica representa un conteo o monto valido.

## Slices

| Slice | Rama | Alcance | Tests |
| --- | --- | --- | --- |
| S01 | `codex/fix-bri-171-investor-overview-placeholder-states` | Artefacto, prueba RED, UI fix, validacion corta | `tests/components/overview-module.test.ts` |

## TDD

1. RED: agregar una prueba que simule `kycStatus = null`, `complianceStatus = null`, `preparedDistributionCurrency = null` y verifique que no aparece `unknown` ni `No finalized run`.
2. GREEN: ajustar `components/dashboard/overview-module.tsx` para renderizar estados explicitos.
3. REFACTOR: mantener helpers pequenos y sin duplicar logica server-side.

## Gates

- `npm test -- tests/components/overview-module.test.ts`
- `npm run lint -- --max-warnings=0 components/dashboard/overview-module.tsx tests/components/overview-module.test.ts`
- `git diff --check`

## Evidence

- RED: `npm test -- tests/components/overview-module.test.ts` failed because the Overview still rendered `unknown` and `No finalized run`.
- GREEN: `npm test -- tests/components/overview-module.test.ts` passed, 4 tests.

## Linear

Se documenta como seguimiento de BRI-171. No requiere issue nuevo porque corrige la presentacion del feature recien integrado.
