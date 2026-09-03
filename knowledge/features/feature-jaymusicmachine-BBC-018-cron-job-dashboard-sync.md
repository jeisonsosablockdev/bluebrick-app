# Problem Spec: Vercel Cron Job for Dashboard Excel Synchronization (BBC-018)

## What problem exists
1. **Sincronización Manual Exclusiva por CLI**: Actualmente, la sincronización de las 7 hojas del libro operativo de Google Drive (`DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx`) hacia Neon PostgreSQL depende exclusivamente de la ejecución manual del comando CLI `pnpm sync:dashboard` (`scripts/sync-dashboard-excel.ts`).
2. **Ausencia de Automatización Periódica en Producción**: En Vercel no existe configuración de tareas programadas (`crons` en `vercel.json`) ni un endpoint Route Handler protegido que permita a Vercel Cron disparar la ingesta periódica de forma desatendida.
3. **Riesgo de Datos Desactualizados para el Inversionista**: Si el equipo operativo actualiza hitos de obra, nuevas fases, estados o transacciones de reinversión en el Excel en Google Drive, estos cambios no se reflejan en el dashboard del inversionista hasta que un ingeniero ejecute el script localmente.
4. **Acoplamiento de la Lógica de Ingesta en un Script CLI**: La lógica de descarga de Drive, parseo con `StreamingSpreadsheetAdapter` y transacciones en Neon reside directamente en `scripts/sync-dashboard-excel.ts`, dificultando su reutilización segura desde Next.js App Router sin duplicar código.

## Why it matters
- **Actualización Continua y Cero Intervención Manual**: Las constructoras y el equipo de operaciones de BlueBrick actualizan avances y fotografías en Google Drive diariamente. El sistema debe digerir estos cambios periódicamente sin requerir despliegues ni ejecuciones manuales por parte del equipo de ingeniería.
- **Fiabilidad y Seguridad en Producción**: La automatización debe estar blindada contra accesos no autorizados mediante la validación de `CRON_SECRET`, garantizando que únicamente el programador de Vercel (o administradores autorizados) pueda iniciar una sincronización.
- **Alineación con la Arquitectura en 4 Capas**: Modularizar la ejecución de la ingesta en un servicio en la capa de Aplicación/Infraestructura permite desacoplar los puntos de entrada (CLI y API Route Handler), manteniendo invariantes de seguridad y trazabilidad idénticas.

## What outcome is expected
1. **Servicio Modular de Sincronización (Capa de Aplicación)**:
   - Crear un servicio reutilizable (`DashboardSyncService`) que encapsule la autenticación con Service Account de Google, descarga del archivo, parseo higienizado y upsert transaccional atómico en PostgreSQL.
2. **Route Handler Protegido en Next.js (Capa de Presentación / API)**:
   - Implementar `apps/web/src/app/api/cron/sync-dashboard/route.ts` con método `GET`, validación de cabecera `Authorization: Bearer <CRON_SECRET>`, control de tiempo de ejecución (`maxDuration = 60`) y respuestas JSON estructuradas con métricas de la sincronización.
3. **Configuración Declarativa en `vercel.json`**:
   - Incorporar la directiva `crons` en `vercel.json` apuntando a `/api/cron/sync-dashboard` con un cronograma periódico óptimo (ej. cada 2 o 4 horas).
4. **Reutilización en Script CLI**:
   - Refactorizar `scripts/sync-dashboard-excel.ts` para invocar el mismo servicio modular, evitando dispersión o divergencia de código entre local y producción.
5. **Cobertura de Pruebas Unitarias e Integración (TDD RED-GREEN-REFACTOR)**:
   - Pruebas exhaustivas que validen rechazo de peticiones no autorizadas (401), ejecución exitosa con token correcto (200), manejo resiliente de errores (500) y parseo de entidades.

## What gaps exist today
- No existe el directorio `apps/web/src/app/api/cron/sync-dashboard`.
- `vercel.json` solo declara `framework` y `outputDirectory`.
- La lógica de sincronización está confinada en `scripts/sync-dashboard-excel.ts`.
- No hay tests para validación de cabeceras de cron ni timeouts.

## What questions remain open
- **Frecuencia del Cron**: ¿Cuál es el intervalo óptimo para Vercel? (Resuelto: En plan Pro se recomienda cada 2 o 4 horas para balancear cuotas de Google Drive API y frescura de datos; en plan Hobby Vercel limita a 1 vez al día).
- **Sincronización Linear**: N/A (Instrucción explícita del usuario: "SKIP LINEAR sync").
