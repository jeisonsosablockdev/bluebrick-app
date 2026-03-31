# Transparency Section

El objetivo de este feature es proporcionar a los usuarios una vista dedicada a la "Transparencia" del proyecto, la cual será accesible desde el pie de página (Footer) de la aplicación.

## Detalles Técnicos de Implementación

### [NEW] `app/transparencia/page.tsx`
- Se crea una página estática/SSR de React bajo el App Router.
- Presentará una interfaz alineada con el diseño del sitio (oscura, glassmorphism) mostrando datos relevantes a la transparencia del proyecto.
- Se actualizaron las secciones para incluir la información de "Estrategia de Inversión" (FIX & HOLD, FIX & FLIP, DESARROLLO INMOBILIARIO).
- Se reemplazó "Security Audits" por "Nuestro SQUAD".
- Se conservaron "Smart Contracts" y "Treasury Wallets".

### [MODIFY] `components/sections/footer.tsx`
- Se insertará bajo la jerarquía elegida el enlace con localización dinámica (i18n) para navegar al `/transparencia`.

---
**Commit #**: `751bf32`
**Status**: Completed
