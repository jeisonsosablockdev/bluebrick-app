# Problem Spec: images-drive-folder-ingestion (BBC-8)

## What problem exists
En la hoja `Fases_Proyecto` del libro de cálculo operativo en Google Drive, la columna `imagen_url_1` (o encabezados afines) ahora contiene enlaces o identificadores a carpetas de Google Drive (ej. `https://drive.google.com/drive/folders/{folderId}`) en lugar de URLs estáticas individuales de fotografías.

Actualmente:
1. [`StreamingSpreadsheetAdapter`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/features/ai-ingestion/infrastructure/streaming-spreadsheet-adapter.ts#L553) mapea de manera fija las columnas `imagen_url_1`, `imagen_url_2` e `imagen_url_3` como cadenas de texto plano directas, sin identificar si la celda referencia una carpeta.
2. [`DashboardSyncService`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/features/ai-ingestion/application/services/dashboard-sync-service.ts#L427) persiste ciegamente estos valores en las tres columnas de la tabla `dashboard_project_phases`.
3. No existe un pipeline automatizado de ingesta que descargue los binarios fotográficos desde Google Drive API v3 y los transfiera hacia el CDN perimetral de **Vercel Blob** con deduplicación por archivo y poda de huérfanos.
4. El navegador no puede renderizar directamente enlaces de carpetas de Drive en el carrusel de avance de obra ([`ProjectPhaseMediaCard`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/components/dashboard/project-phase-media-card.tsx)), resultando en pantallas de fallback o enlaces rotos.

## Why it matters
1. **Flujo Operativo de Construcción Sin Fricción**: Los ingenieros y directores de proyecto en obra suben decenas de fotos a carpetas compartidas de Google Drive. Exigirles pegar enlaces foto por foto en celdas individuales es propenso a errores y limita la cantidad de imágenes.
2. **Seguridad Zero-Trust y Privacidad**: Las carpetas de Google Drive de la compañía deben permanecer privadas y protegidas con la Service Account. El navegador del inversionista jamás debe tener credenciales ni interactuar directamente con Google Drive.
3. **Rendimiento Edge y Disponibilidad**: Servir imágenes mediante el CDN global de Vercel Blob garantiza latencia mínima (<50ms), optimización de entrega y previene bloqueos por cuotas o rate-limits de Google Drive API.
4. **Eficiencia de Almacenamiento y Costos**: Un sistema de deduplicación y poda de huérfanos asegura que las fotos no se suban repetidamente a Vercel Blob en cada ciclo de sincronización y que las fotos eliminadas de Drive no sigan consumiendo espacio en el CDN.

## What outcome is expected
1. **Detección de Carpetas en Spreadsheet**: `StreamingSpreadsheetAdapter` analiza `imagen_url_1` y detecta si es un enlace de carpeta de Drive (`https://drive.google.com/drive/folders/...`) o un ID de carpeta, normalizándolo como `folderId`.
2. **Resolución de Archivos desde Drive API v3**: Durante el ciclo de sincronización (`DashboardSyncService`), el sistema consulta los archivos dentro de la carpeta con filtro MIME (`image/jpeg`, `image/png`, `image/webp`).
3. **Deduplicación Inteligente en `media_assets`**:
   - Si el archivo (`drive_file_id`) ya fue subido y su firma no ha cambiado, se reutiliza su `blob_url` en Vercel Blob sin volver a descargar ni transferir bytes.
   - Si es un archivo nuevo o modificado, se descarga de Drive, se validan sus magic bytes y se sube a Vercel Blob mediante [`VercelBlobAdapter`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/features/ai-ingestion/infrastructure/vercel-blob-adapter.ts).
4. **Mantenimiento y Poda de Huérfanos (Cleanup)**:
   - Las fotos que hayan sido retiradas de la carpeta de Drive son detectadas y eliminadas de Vercel Blob mediante `@vercel/blob` `del()`.
5. **Persistencia en PostgreSQL**:
   - La tabla `dashboard_project_phases` almacena `folder_url TEXT` e `imagenes TEXT[]` con todas las URLs de Vercel Blob generadas, manteniendo `imagen_url_1, 2, 3` pobladas con las primeras fotos para retrocompatibilidad.
6. **Consumo Transparente en Dashboard**:
   - [`InvestmentRepository`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/lib/infrastructure/db/repositories/investment-repository.ts#L385) provee `item.phases[].images` a la UI. [`ProjectPhaseMediaCard`](file:///Users/jaymusicmachine/Documents/Desarrollo/bluebrick-app/apps/web/src/components/dashboard/project-phase-media-card.tsx) visualiza todas las imágenes en su carrusel interactivo con transiciones de Motion.

## What gaps exist today
1. **Parser Spreadsheet**: Falta helper de extracción y detección de Google Drive Folder ID en `StreamingSpreadsheetAdapter`.
2. **Lector de Carpetas de Google Drive**: Falta puerto e implementación (`IGoogleDriveFolderReaderPort` o método en `GoogleDriveChangesAdapter`) para listar archivos de un folder usando Google Drive API v3.
3. **Esquema de Base de Datos**: La tabla `dashboard_project_phases` solo tiene columnas escalares `imagen_url_1, 2, 3`, careciendo de `folder_url TEXT` y `imagenes TEXT[]`.
4. **Orquestación en Sync Service**: `DashboardSyncService` no coordina la llamada al lector de carpetas, la deduplicación con `media_assets` ni la subida a Vercel Blob durante el paso `upsertProjectPhases`.

## What questions remain open
- **Ninguna pregunta bloqueante**: El usuario confirmó que la ingesta debe ocurrir en la sincronización desde Drive hacia Vercel Blob, sirviendo exclusivamente desde servidores autorizados y Vercel Blob CDN, utilizando el sistema de deduplicación y el dashboard existente.
