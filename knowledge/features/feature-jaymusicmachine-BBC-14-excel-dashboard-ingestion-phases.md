# Problem Spec: Multi-Sheet Excel Dashboard Ingestion & Project Phases Sync (BBC-14)

## What problem exists
1. **Fases de Avance Estáticas y Hardcodeadas**: El componente `project-phase-progress.tsx` utiliza un arreglo estático de 12 fases ficticias (`DEFAULT_PHASES`) y calcula el avance mediante una heurística sintética basada en `monthsLeft * 0.9`. No refleja el avance real ni las imágenes reales de obra.
2. **Desconexión con el Libro Operativo de Google Drive**: El archivo operativo `DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx` en Google Drive contiene la verdad de negocio estructurada en múltiples pestañas (`Proyectos `, `Inversionistas`, `Inversiones`, `Fases_Proyecto`, `Oportunidades`, `Resumen_Dashboard`), pero el sistema de ingesta existente solo procesaba una hoja plana de clientes.
3. **Ausencia de Tablas y Esquemas en PostgreSQL (Neon)**: La base de datos no cuenta con tablas relacionales ni columnas normalizadas para almacenar proyectos por SKU/ID (`id_inversion`: `BG-01`, `BK-02`, etc.), las 14 fases de obra por proyecto con sus estados (`Completada`, `En curso`, `Pendiente`), sus fechas y las URLs de imágenes de avance por fase.

## Why it matters
- **Transparencia y Confianza para el Inversionista**: Los inversionistas que ingresan a la plataforma privada deben ver el avance verídico de la obra en tiempo real de su propiedad (ej. Bush Garden al 57.14%, Fase 9 "Acabados" en curso con fotos reales de cimentación y estructura).
- **Mantenibilidad Operativa Continuada**: El equipo de operaciones y administración actualiza diariamente el Excel en Google Drive. El sistema de ingesta automatizado debe digerir periódica y determinísticamente todas las hojas del archivo hacia PostgreSQL sin requerir inserciones manuales en SQL ni deploy de código.
- **Escalabilidad de la Arquitectura en 4 Capas**: Establece modelos de dominio canónicos fuertemente tipados con Zod, repositorios eficientes y desacoplamiento limpio entre la ingesta (Infraestructura) y la visualización (Presentación).

## What outcome is expected
1. **DDL Migration en PostgreSQL (Neon)**:
   - Crear / actualizar tablas o esquemas relacionales para soportar:
     - `properties` / `projects` con `id` (SKU ej. `BG-01`), `name`, `city`, `type`, `status`, `fase_actual`, `avance_fase_pct`, `drive_folder_url`.
     - `project_phases` con `id_fase`, `project_id` (FK), `orden` (1 a 14), `nombre_fase`, `estado` (`Completada`, `En curso`, `Pendiente`), `fecha_inicio`, `fecha_fin`, `imagenes` (URLs de fotos de avance).
     - `reinvestment_opportunities` sincronizada directamente desde la pestaña `Oportunidades`.
     - `user_investments` / `clients` vinculados directamente al `id_inversion` / `project_id`.
2. **Motor de Digestión Multi-Pestaña de Excel**:
   - Extender el adaptador de hojas de cálculo (`streaming-spreadsheet-adapter.ts`) y los puertos de dominio para procesar el libro completo `DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx` respetando la higienización de fórmulas CSV/DDE y conversión de números seriales de fecha de Excel.
3. **Repositorio y Consultas en Capa de Aplicación**:
   - `InvestmentRepository` y nuevos servicios consultan las fases reales de la propiedad activa y las entregan al Dashboard.
4. **Dashboard Dinámico en Capa de Presentación**:
   - `ProjectPhaseProgress` renderiza las fases reales del proyecto seleccionado en el carrusel (14 fases reales para Bush Garden, Carrollwood, etc.), mostrando el porcentaje exacto (`57.14%`), el estado real de cada hito y la galería de fotos reales de avance.

## What gaps exist today
- El parser de hojas de cálculo solo procesaba una colección homogénea de clientes.
- No existían esquemas Zod canónicos para `CanonicalProjectPhase` ni `CanonicalMultiSheetDashboard`.
- El componente `ProjectPhaseProgress` no recibía una prop de fases dinámicas desde el backend/PostgreSQL.

## What questions remain open
- ¿Cómo se manejan los proyectos que aún no tienen fotos en ciertas fases? (Resuelto: fallback visual limpio y elegante ya soportado en el componente).
- ¿Qué identificador unifica la inversión del cliente con su proyecto? (Resuelto: `id_inversion`, ej. `BG-01` para Bush Garden).
