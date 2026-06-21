# BRI-68 — Home title explícito `Home | BRIDS`

## Resumen
- Se ajustó el metadata de la página Home para que el título del documento sea explícitamente `Home | BRIDS`.

## Cambios
- Archivo actualizado: `app/page.tsx`
  - Se conserva la metadata SEO base de `createPageMetadata(...)`.
  - Se fuerza `title.absolute = "Home | BRIDS"` para evitar ambigüedad en el título final de la pestaña.

## Alcance
- Cambio acotado a metadata de la Home.
- Sin impacto en lógica de negocio ni en flujos on-chain.
