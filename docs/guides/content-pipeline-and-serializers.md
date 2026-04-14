# Content Pipeline and Serializers

## Objetivo
Definir una ruta unica y deterministic para transformar documentos `content-as-code` en salidas reutilizables para web, feeds y contratos machine-readable.

## Etapas del Pipeline
Secuencia ejecutada por `buildPipelineDocument`:
1. `normalizeMarkdown`: normaliza saltos de linea y cuerpo base.
2. `extractHeadings`: extrae headings `h1..h6` con IDs estables.
3. `buildToc`: deriva TOC desde headings (profundidad <= 3).
4. `markdownToPlainText`: genera texto plano para derivaciones.
5. `countWords` + `estimateReadingTimeMinutes`: calcula lectura estimada.
6. `deriveTechnicalSummary`: resumen tecnico deterministic.
7. `renderMarkdownToHtml`: render HTML basico sin dependencias externas.

## Salida Estandar del Pipeline
Cada `ContentPipelineDocument` incluye:
- metadatos del documento original
- `normalizedBody`
- `renderedHtml`
- `renderedMdx`
- `plainText`
- `technicalSummary`
- `headings[]`
- `toc[]`
- `wordCount`
- `readingTimeMinutes`

## Serializadores
Ubicacion: `lib/content/serializers/`

- `web`
  - salida rica para templates/render server-side
  - incluye html/mdx, headings/toc, reading-time
- `feed`
  - salida compacta para syndication
  - incluye `excerpt` y metadatos esenciales
- `ai`
  - salida sanitizada para contratos machine-readable
  - misma base de datos que web/feed, sin duplicar logica

## Indice de Busqueda (Build Artifact)
`buildSearchIndexArtifact` genera un artefacto interno para R09:
- `schemaVersion`
- `generatedAt`
- `totalDocuments`
- `entries[]` ordenadas por `slug`
- cada entry incluye:
  - metadatos canonicos
  - headings
  - reading-time
  - `tokens[]` normalizados para indexacion local

## Integracion con AI Endpoints
`lib/ai/service.ts` consume:
- `buildPipelineDocument`
- `serializePipelineDocumentForAi`

Esto asegura que contratos AI hereden exactamente las mismas derivaciones estructurales que la capa web/feed.

## Validacion
- `tests/lib/content-pipeline-serialization.test.ts`
- `npm run validate:pipeline`
- `npm run validate` (incluye `validate:pipeline` en la cadena principal)
