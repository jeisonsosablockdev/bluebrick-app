# Feature: EPIC-010 STORY-010-06 AI Readable and Machine Endpoints

## Summary
Implementacion de la capa machine-readable publica para agentes y LLM systems, con contratos JSON versionados y politicas `published-only`.

## Scope Delivered
- Capa `lib/ai` con contrato y builders:
  - `contracts.ts` (schemas/tipos versionados)
  - `service.ts` (serializacion, sanitizacion, filtro `published-only`)
  - `index.ts` (barrel)
- Endpoints y archivos publicos:
  - `/api/knowledge`
  - `/api/entities`
  - `/api/definitions`
  - `/knowledge.json`
  - `/llms.txt`
  - `/ai.txt` (controlado por feature flag `ENABLE_AI_TXT`)
- Contrato estable:
  - `schemaVersion`
  - `generatedAt`
  - `items`
- Validacion automatizada:
  - `tests/lib/ai-readable-contracts.test.ts`
  - `tests/api/ai-readable-endpoints.test.ts`
  - script `validate:ai` agregado a `npm run validate`

## Notes
- Solo se exponen documentos con estado `published`.
- No se expone `body` ni `sourcePath` de contenido interno.
- `ai.txt` permanece deshabilitado por defecto para evitar superficie publica no requerida.

## RFC Traceability
- Epic: `EPIC-010-ai-discovery-infrastructure-and-seo-for-brids`
- Story: `STORY-010-06-ai-readable-and-machine-endpoints`
- Linear: `BRI-56`
