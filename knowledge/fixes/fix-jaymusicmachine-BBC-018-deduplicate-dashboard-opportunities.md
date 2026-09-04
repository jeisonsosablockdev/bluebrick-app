# Problem Spec: deduplicate-dashboard-opportunities

## What problem exists
En la vista móvil y de escritorio del Dashboard de Inversión (`/dashboard`), en la sección "NUEVAS OPORTUNIDADES PARA JUAN - Haz crecer tu patrimonio", la tarjeta de la propiedad `MULBERRY` aparece triplicada (3 veces repetida de forma idéntica: `TAMPA`, `ROI est. 16%`, `desde $24,500`).

La inspección de la base de datos Neon PostgreSQL reveló que la tabla `reinvestment_opportunities` contiene 3 registros distintos para la misma oportunidad física:
1. `id: 'opp_mb_05'` (creado el 2026-08-30 como seed/fixture original).
2. `id: 'MB-05'` (creado el 2026-09-01 en una sincronización previa de Excel con ID `MB-05`).
3. `id: 'MB-07'` (creado el 2026-09-03 en la sincronización reciente de Excel tras renumerar la oportunidad a `MB-07`).

Adicionalmente, la tabla `dashboard_opportunities` contiene 2 registros activos (`MB-05` y `MB-07`).

## Why it matters
1. **Experiencia de Usuario y Confianza Institucional**: Mostrar tres tarjetas idénticas de `MULBERRY` degrada la percepción de profesionalismo y calidad de la plataforma BlueBrick frente a inversionistas de alto patrimonio.
2. **Integridad de Datos del Pipeline de Ingesta**: El servicio `DashboardSyncService` ejecuta `INSERT ... ON CONFLICT (id) DO UPDATE ...`, pero nunca poda ni elimina registros huérfanos o antiguos cuando un administrador cambia el identificador de una oportunidad en el Excel de Google Drive (por ejemplo, renombrar `MB-05` a `MB-07`).
3. **Falta de Deduplicación Defensiva en el Repositorio**: `InvestmentRepository.getReinvestmentOpportunities()` realiza un `SELECT * FROM reinvestment_opportunities ORDER BY projected_roi DESC;` plano sin deduplicar por nombre o título de oportunidad.

## What outcome is expected
1. **Poda Transaccional en Ingesta**: `DashboardSyncService` debe limpiar de forma atómica en Neon PostgreSQL cualquier oportunidad previa en `reinvestment_opportunities` y `dashboard_opportunities` que ya no esté presente en la hoja `Oportunidades` del libro de Excel activo.
2. **Deduplicación Defensiva en Capa 4 (Repositorio)**: `InvestmentRepository.getReinvestmentOpportunities()` debe garantizar deduplicación estricta por título/proyecto (priorizando el registro más reciente), evitando que registros remanentes generen duplicados visuales en la UI.
3. **Saneamiento Inmediato de Base de Datos**: Ejecutar la poda de registros obsoletos (`opp_mb_05` y `MB-05`) en Neon PostgreSQL para que sólo subsista el registro activo vigente (`MB-07`).
4. **Verificación Visual y de Pruebas**: La UI del dashboard renderizará exactamente 1 tarjeta de `MULBERRY` y las suites de pruebas unitarias validarán tanto la poda transaccional como la deduplicación del repositorio.

## What gaps exist today
1. `DashboardSyncService` carece de una cláusula `DELETE FROM ... WHERE id NOT IN (...)` o poda diferencial para la hoja de oportunidades.
2. `InvestmentRepository` asume que la base de datos nunca tendrá registros duplicados por título con distintos IDs primarios.
3. La base de datos compartida contiene filas históricas con IDs `opp_mb_05` y `MB-05`.

## What questions remain open
- Ninguna. La causa raíz fue verificada en la base de datos real y el alcance de solución está acotado a la poda en sincronización y deduplicación defensiva en el repositorio.
