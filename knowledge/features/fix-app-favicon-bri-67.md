# BRI-67 — Favicon del website con `B.svg`

## Resumen
- Se configuró el favicon global del sitio para usar `public/favicon.svg`.
- El archivo fuente corresponde al asset definido en el issue BRI-67 (`B.svg`).

## Cambios
- Se agregó `public/favicon.svg`.
- Se actualizó `lib/seo/metadata.ts` para exponer íconos globales en metadata raíz:
  - `icons.icon` con `image/svg+xml`
  - `icons.shortcut`

## Alcance
- Cambio acotado a branding visual del favicon.
- Sin impacto en lógica funcional ni flujos de negocio.
