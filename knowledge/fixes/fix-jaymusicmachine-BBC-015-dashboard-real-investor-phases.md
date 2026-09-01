# Problem Spec: dashboard-real-investor-phases (BBC-015)

## What problem exists
En el panel del inversionista (Dashboard), el componente **'AVANCE DE OBRA POR FASES'** (`ProjectPhaseProgress.tsx`) no consumía directamente los datos reales de las tablas del dashboard en PostgreSQL (`dashboard_investors`, `dashboard_investments`, `dashboard_project_phases`) para inversionistas reales autenticados.
El perfil de **Sofía Martínez** es un perfil de demostración que debe utilizar datos de fallback. Sin embargo, cuando un inversionista real autenticado (o consultado por email, ej. Francisco Garzón, Esteban Ceballos, Jayson Sosa) ingresa al dashboard:
1. El repositorio `InvestmentRepository` priorizaba la tabla legacy `clients` en lugar de resolver de forma directa las tablas especializadas `dashboard_investors` y `dashboard_investments` creadas en BBC-14.
2. Si el inversionista cambia de proyecto en el carrusel del dashboard, el componente `ProjectPhaseProgress` no reiniciaba el estado local `selectedPhaseIndex` (debido a que `useState` sólo captura el valor en montaje inicial sin sincronizar cambios de propiedad vía `useEffect`).
3. El ancho de la barra animada de progreso calculaba el porcentaje basándose en la posición del hito seleccionado (`activePhaseIndex / totalPhases`) en lugar de reflejar el porcentaje real de avance de obra reportado en la base de datos (`property.phaseProgressPct` / `completionPercentage`).

## Why it matters
Los inversionistas de BlueBrick confían en la plataforma para auditar el estado real de sus activos inmobiliarios en Florida (ej. Bush Garden `BG-01`, Carrollwood `CW-04`, Brooksville `BK-02`). Mostrar estados genéricos o no reflejar las 14 fases de obra reales rompe la transparencia y el valor de la integración con los datos del panel administrativo de Excel sincronizado en PostgreSQL. Mantener la separación limpia entre el demo de Sofía Martínez y los datos de usuarios reales es indispensable.

## What outcome is expected
1. **Diferenciación estricta entre Demo y Usuario Real**:
   - `user_sofia_martinez` continúa operando como perfil de demostración con datos de fallback (`FALLBACK_PROPERTIES`).
   - Cuando un usuario real ingresa (autenticado por WorkOS o verificado por email), el sistema consulta prioritariamente `dashboard_investors` y `dashboard_investments`, enriqueciendo cada inversión con las 14 fases de `dashboard_project_phases`.
2. **Consumo Dinámico de Fases en el Card**:
   - La barra de progreso y el indicador numérico renderizan el porcentaje exacto de avance de obra (`57.14%`, `42.86%`, etc.).
   - La fase activa se detecta directamente a partir del estado de la tabla (`En curso`, o la última `Completada`).
   - Cada hito (punto) refleja visualmente su estado real: `Completada` (verde esmeralda con check), `En curso` (rojo/carmesí con pulso activo), `Pendiente` (gris/neutro).
3. **Sincronización Reactiva con el Carrusel**:
   - Al navegar entre tarjetas de inversión en el carrusel, el card de avance de obra actualiza automáticamente sus fases, porcentaje y foto de la nueva propiedad activa.

## What gaps exist today
- En `InvestmentRepository.getPortfolioSummary()`, la consulta primaria no incluía `dashboard_investments JOIN dashboard_investors`.
- En `ProjectPhaseProgress.tsx`, falta un `useEffect` para sincronizar `selectedPhaseIndex` cuando cambia `property.id` o `property.propertyId`.
- El ancho de la línea de llenado de `motion.div` estaba desacoplado de `completionPercentage`.

## What questions remain open
- Ninguna. El usuario especificó explícitamente: "el perfil de sofia martinez es solo un demo y muestra los datos del fallback, pero cuando un usuario real entra a ver sus datos le deben ser mostrados los datos reales". No sincronizar en Linear.
