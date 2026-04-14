# EPIC-010-ai-discovery-infrastructure-and-seo-for-brids

## Metadata
- Epic ID: `EPIC-010`
- Title: `AI Discovery Infrastructure and SEO for BRIDS`
- Status: `approved`
- Owner: `jaymusicmachine`
- Created: `2026-04-13`
- Last Updated: `2026-04-14`

## Scope
- Problem statement:
  - BRIDS necesita una base web que funcione simultáneamente para usuarios humanos, buscadores tradicionales y sistemas AI/LLM, con separación explícita entre capa de software, capa informativa y capa regulatoria/documental.
- Business goal:
  - Posicionar BRIDS como plataforma tecnológica y acelerar publicación de conocimiento sin depender de CMS pago.
- Technical goal:
  - Implementar infraestructura content-as-code en Next.js con SEO técnico, machine-readable outputs, validación y pipeline de publicación listo para conectar documentación.
- Out of scope:
  - Redacción de contenido final.
  - Estrategia editorial/copywriting final.
  - RAG/embeddings activos en producción.
  - Chatbot público.
  - Interfaz CMS/WYSIWYG para editores no técnicos.
  - Backoffice de authoring para non-code editors.
  - Integración de métricas on-chain en analytics de esta fase.
  - Implementación de Helius Webhooks en EPIC-010.

## Requirement Catalog (RFC)
| ID | Requirement |
| --- | --- |
| R01 | Estructura base Next.js por capas (software/informativa/regulatoria) |
| R02 | Content-as-code (MD/MDX) versionado en Git |
| R03 | Modelo editorial tipado por tipo documental |
| R04 | Arquitectura de rutas semánticas y navegación escalable |
| R05 | SEO técnico completo (metadata/canonical/OG/X/robots/sitemap/breadcrumbs) |
| R06 | JSON-LD por tipo de página |
| R07 | Capa AI-readable (/llms.txt, /ai.txt opcional, /knowledge.json, APIs) |
| R08 | Pipeline parse/validación/serialización/resumen/TOC/reading-time |
| R09 | Preparación de buscador interno indexado en build |
| R10 | Infraestructura semántica de entidades/conceptos/relaciones |
| R11 | Navegación contextual (related, prev/next, cross-links, breadcrumbs) |
| R12 | Templates reutilizables por tipo de página |
| R13 | Componentes para documentación técnica/institucional larga |
| R14 | Sistema de versionado documental (draft/published/superseded) |
| R15 | Validación/linting de contenido y links |
| R16 | Feeds y exportaciones (RSS, JSON Feed, recientes, exports) |
| R17 | Analytics y observabilidad básica (admin-visible) |
| R18 | Monitoreo técnico y gates de calidad |
| R19 | Performance base (SSG/cache/assets/lazy/fonts/images) |
| R20 | Seguridad pública base (headers, CSP, sanitización, separación APIs) |
| R21 | Entorno de despliegue (staging/prod/previews/envs) |
| R22 | Puntos de extensión para búsqueda semántica futura |
| R23 | Documentación interna operativa del sistema |

## Success Criteria
- [ ] Infraestructura lista para publicar contenido sin rediseño de arquitectura.
- [ ] Todos los requisitos R01–R23 cubiertos por historias aprobadas y trazables.
- [ ] Pipeline de validación y publicación ejecuta en CI sin dependencias de CMS externo.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-010-01 | Foundation and Layered Architecture | `STORY-010-01-foundation-and-layered-architecture.md` | `implemented` | `TBD` | Cubre R01 |
| STORY-010-02 | Content as Code and Editorial Contracts | `STORY-010-02-content-as-code-and-editorial-contracts.md` | `in-review` | `TBD` | Cubre R02, R03, R14, R15 (branch `story-010-02-content-as-code-and-editorial-contracts-bri-52`) |
| STORY-010-03 | Route Architecture and Reusable Templates | `STORY-010-03-route-architecture-and-reusable-templates.md` | `in-review` | `TBD` | Cubre R04, R11, R12, R13 (branch `story-010-03-route-architecture-and-reusable-templates-bri-53`) |
| STORY-010-04 | Technical SEO Infrastructure | `STORY-010-04-technical-seo-infrastructure.md` | `in-review` | `TBD` | Cubre R05 (branch `story-010-04-technical-seo-infrastructure-bri-54`) |
| STORY-010-05 | Structured Data JSON-LD Layer | `STORY-010-05-structured-data-json-ld-layer.md` | `in-review` | `TBD` | Cubre R06 (branch `story-010-05-structured-data-json-ld-layer-bri-55`) |
| STORY-010-06 | AI Readable and Machine Endpoints | `STORY-010-06-ai-readable-and-machine-endpoints.md` | `in-review` | `TBD` | Cubre R07 (branch `story-010-06-ai-readable-and-machine-endpoints-bri-56`) |
| STORY-010-07 | Content Pipeline and Serialization | `STORY-010-07-content-pipeline-and-serialization.md` | `in-review` | `TBD` | Cubre R08, R09 (branch `story-010-07-content-pipeline-and-serialization-bri-57`) |
| STORY-010-08 | Semantic Layer for Entities and Relations | `STORY-010-08-semantic-layer-for-entities-and-relations.md` | `in-review` | `TBD` | Cubre R10, R11 (branch `story-010-08-semantic-layer-for-entities-and-relations-bri-58`) |
| STORY-010-09 | Feeds, Exports, and Internal Search Readiness | `STORY-010-09-feeds-exports-and-internal-search-readiness.md` | `in-review` | `TBD` | Cubre R09, R16 (branch `story-010-09-feeds-exports-and-internal-search-readiness-bri-59`) |
| STORY-010-10 | Observability, Security, Performance, Deploy, Docs | `STORY-010-10-observability-security-performance-deploy-docs.md` | `approved` | `TBD` | Cubre R17–R23 |

## Execution Roadmap (technical, executable)
### Phase 1 - MVP Foundation (deployable, indexable)
1. STORY-010-01
2. STORY-010-02
3. STORY-010-03
4. STORY-010-04

### Phase 2 - Machine Readability and Pipeline
5. STORY-010-05
6. STORY-010-06
7. STORY-010-07

### Phase 3 - Semantic and Distribution Expansion
8. STORY-010-08
9. STORY-010-09

### Phase 4 - Operational Hardening and Scale Readiness
10. STORY-010-10

Dependency rule:
- No story starts until previous story has `Decision=approved` and acceptance checklist complete.

Release rule:
- Cada fase debe cerrar con evidencia de CI verde y checklist de aceptación completo antes de iniciar la siguiente.

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-04-13 | STORY-010-01 | Approved technical plan and scope | jaymusicmachine | `STORY-010-01-foundation-and-layered-architecture.md` |
| 2026-04-13 | STORY-010-02 | Approved editorial contract model | jaymusicmachine | `STORY-010-02-content-as-code-and-editorial-contracts.md` |
| 2026-04-13 | STORY-010-03 | Approved route/template architecture | jaymusicmachine | `STORY-010-03-route-architecture-and-reusable-templates.md` |
| 2026-04-13 | STORY-010-04 | Approved SEO baseline | jaymusicmachine | `STORY-010-04-technical-seo-infrastructure.md` |
| 2026-04-13 | STORY-010-05 | Approved JSON-LD emitters | jaymusicmachine | `STORY-010-05-structured-data-json-ld-layer.md` |
| 2026-04-13 | STORY-010-06 | Approved AI-readable endpoints | jaymusicmachine | `STORY-010-06-ai-readable-and-machine-endpoints.md` |
| 2026-04-13 | STORY-010-07 | Approved content pipeline | jaymusicmachine | `STORY-010-07-content-pipeline-and-serialization.md` |
| 2026-04-13 | STORY-010-08 | Approved semantic graph layer | jaymusicmachine | `STORY-010-08-semantic-layer-for-entities-and-relations.md` |
| 2026-04-13 | STORY-010-09 | Approved feeds/exports/search readiness | jaymusicmachine | `STORY-010-09-feeds-exports-and-internal-search-readiness.md` |
| 2026-04-13 | STORY-010-10 | Approved hardening/deploy/docs phase | jaymusicmachine | `STORY-010-10-observability-security-performance-deploy-docs.md` |

## Critique (Staff Engineer Review)
- **3 Critical Weaknesses**:
  1. **Risky "Big Bang" Execution**: The roadmap sequences 10 stories to build a comprehensive infrastructure without a phased, value-driven rollout. This monolithic approach is high-risk; a delay or failure in a late-stage story (e.g., R10 Semantic Layer) could block the entire epic. The plan lacks an MVP (e.g., a basic blog) to deliver value and gather feedback early.
  2. **Ambiguous Semantic Layer (R10)**: The requirement for a "semantic infrastructure" is critically undefined. It lacks specifics on the ontology, storage (e.g., graph DB vs. flat files), or maintenance process. This ambiguity risks turning STORY-010-08 into an unbounded research project, jeopardizing the timeline and dependent features like advanced search (R22).
  3. **Undefined Performance Gates (R19)**: The "performance base" requirement is a checklist, not a strategy with measurable targets. It omits crucial performance budgets (e.g., Core Web Vitals, Lighthouse scores, build time thresholds). For a content-as-code architecture, SSG build times are a known scaling bottleneck that isn't addressed with a concrete mitigation plan (e.g., Incremental Static Regeneration).

- **Execution Risks**:
  - **Build Time Bottleneck**: The complex content pipeline (R08) combined with build-time search indexing (R09) will likely lead to unacceptably long build times as content scales, crippling editorial velocity.
  - **Content-Schema Coupling**: Without a strict anti-corruption layer, UI components (R12, R13) risk becoming tightly coupled to the MDX frontmatter schema (R03). A change in the editorial contract could trigger a cascade of required code changes, negating the flexibility of the "content-as-code" model.
  - **Ineffective SEO/AI Output**: The epic's success hinges on machine-readability. Without mandatory CI gates to validate the generated JSON-LD (R06) and other structured data against tools like Google's Rich Result Test, the project could ship technically valid but semantically useless data, failing a core business goal.

- **Uncovered Edge Cases**:
  - **Content Lifecycle Management**: The versioning system (R14) for `draft/published/superseded` statuses doesn't specify a URL and redirect strategy for outdated or renamed content. This is a critical gap for maintaining SEO link equity.
  - **Editorial Workflow & Previews**: The plan assumes a developer-centric "content-as-code" workflow. It doesn't address how non-technical editors will preview draft content before it's merged, a significant usability gap.
  - **Broken Link Management**: R15 mentions link validation, but fails to define the process for detecting and remediating broken links in production content post-deployment.

- **Stack Alignment**:
  - **@helius**: The plan for analytics and observability (R17) is vague. If any metrics involve on-chain activity, the use of Helius Webhooks should be explicitly mandated as per project standards. This is currently missing.

- **Incorrect Assumptions**:
  - It's assumed that a sequential, 10-story implementation is the most effective approach, which is a high-risk waterfall-style assumption.
  - It's assumed that a Git-based "content-as-code" workflow is frictionless for all content creators, ignoring the potential learning curve for non-developers.
  - It's assumed that the "semantic layer" (R10) is a single, containable story rather than a potentially massive project in its own right.

- **Mandatory Tests**:
  1. **Build Scalability Test**: A CI job that generates 1k and 10k dummy content pages and asserts that the total build time remains under a defined budget (e.g., < 5 minutes).
  2. **Structured Data Validation**: Every build must run key pages and the generated sitemap through the Google Rich Result Test and a schema.org validator, failing the build on any validation errors.
  3. **Content Contract Test**: A suite of unit tests that validates the frontmatter schema for every content type. Invalid content files (e.g., missing `title`, invalid `status`) must fail the build.
  4. **Redirect & URL Test**: An integration test to verify that renamed or `superseded` content correctly serves a 301 redirect to its new canonical URL.

- **Verdict**: `approve with changes`

## Resolution (Post-Critique)
- **Acciones Obligatorias para Aprobación**:
  1. Reestructurar el `Execution Roadmap` en fases, comenzando con un MVP (e.g., un blog básico con R01, R02, R04, R05, R19) y luego agregar capas de complejidad.
  2. `STORY-010-08` debe definir explícitamente el alcance del MVP para la capa semántica, incluyendo la ontología inicial y el mecanismo de almacenamiento.
  3. `STORY-010-10` debe incluir la definición de un presupuesto de rendimiento (build time, Lighthouse scores) y la estrategia de escalado (e.g., ISR).
  4. `STORY-010-02` debe definir la estrategia de redireccionamiento para contenido actualizado y un flujo de previsualización **code-only** basado en PR previews/staging para maintainers técnicos.
  5. El plan de pruebas para todas las historias relevantes debe incluir los "Mandatory Tests" definidos en la crítica.

### Client Directive (Scope Lock)
- La operación editorial de esta fase será exclusivamente `content-as-code` (Git + PR + CI).
- No se implementará UI para non-code editors en EPIC-010.
- Cualquier necesidad de interfaz editorial se evaluará en un epic posterior.
- Si en una fase futura se incorporan métricas on-chain dentro de `R17`, se deberá usar `Helius Webhooks` como mecanismo obligatorio de ingestión/eventos.
- Dicha integración on-chain queda explícitamente fuera del alcance de EPIC-010.

### Mandatory Tests Adopted
1. Build Scalability Test:
   - Job CI con dataset sintético (1k y 10k documentos) y presupuesto de build definido.
2. Structured Data Validation:
   - Validación automatizada de JSON-LD/schema.org y chequeos de elegibilidad de rich results.
3. Content Contract Test:
   - Validación estricta de frontmatter y estado documental en todos los tipos.
4. Redirect and URL Test:
   - Verificación de estrategia 301 para contenido renombrado o `superseded`.

## Risks and Dependencies
- Risks:
  - Scope creep hacia creación de contenido final.
  - Acoplamiento entre capa informativa y capa de software productiva.
  - Sobreingeniería temprana de búsqueda semántica.
- Dependencies:
  - Next.js App Router estable en repo.
  - Pipeline CI con lint/typecheck/build.
  - Definición de dominio/subdominio para deploy.
- Mitigations:
  - Enforce “infra-only mode” en AGENTS.md.
  - Contratos de contenido estrictos y validación por schema.
  - Extensión semántica solo como interface contract, no runtime heavy.

## Open Questions
- [ ] ¿`/ai.txt` será obligatorio o solo opcional?
- [ ] ¿El knowledge export público debe incluir toda la capa regulatoria o solo subconjuntos?
- [ ] ¿Se publica una sola taxonomía global o taxonomías por dominio (`software`, `knowledge`, `regulatory`)?

## Traceability
- Issue(s): `BRI-50`
- Project: `EPIC 010 - AI Discovery Infrastructure and SEO for BRIDS`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
