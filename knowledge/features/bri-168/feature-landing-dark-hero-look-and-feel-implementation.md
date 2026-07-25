---
type: Feature Spec
title: Feature Landing Dark Hero Look And Feel Implementation
description: Feature Landing Dark Hero Look And Feel Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-168/feature-landing-dark-hero-look-and-feel-implementation.md
---

# Implementation Plan: Landing Dark Hero Look And Feel

## VERSION ESPAÑOL

### Status
- Implementation slice
- Issue: `BRI-168`
- Developer: `czambrano`
- Rama SPEC: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Depends on: `knowledge/features/feature-landing-dark-hero-look-and-feel.md`
- Linear source of truth: cuerpo del issue `BRI-168`

### Objetivo
Implementar el primer slice visual del landing empezando por el Hero dark mode: fondo azul oscuro con blur gaussiano, superficies internas sin borde blanco y continuidad con el lenguaje visual de la referencia.

### Decisiones
1. Mantener `HeroSection` como client component porque ya depende de i18n y conteo formateado.
2. No modificar `Card` global para evitar afectar dashboards, marketplace, admin y otras superficies.
3. Reemplazar los `Card` del Hero por paneles locales sin borde.
4. Agregar clases CSS específicas del Hero para el fondo oscuro, el blur ambiental y la compatibilidad con light mode.
5. Mantener copy, CTAs, rutas, datos dinámicos e imagen actual sin cambios funcionales.

### Tokens visuales
- Base: azul noche casi negro.
- Blur ambiental: cyan a la izquierda/superior y violeta a la derecha/inferior.
- Paneles: `rgba` oscuro con `backdrop-filter: blur(...)`.
- Sombras: profundas y suaves, sin outline blanco.
- Radios: grandes en el Hero, medianos en paneles internos.

### Archivos
- `components/sections/hero.tsx`
- `app/globals.css`

### Pasos de implementación
1. Crear una clase local para el shell del Hero dark.
2. Agregar pseudo-elementos difusos para el blur gaussiano ambiental.
3. Reemplazar tarjetas internas por contenedores borderless.
4. Ajustar CTA secundario para que no tenga borde blanco en este Hero.
5. Agregar overrides light mode específicos para conservar legibilidad.

### Resultado
- `HeroSection` usa clases locales `landing-hero-*` para shell, paneles, texto, CTA secundario, media overlay y métricas.
- El Hero dejó de depender del componente global `Card`, evitando impacto en dashboards, marketplace, admin y otras superficies.
- Los paneles internos no tienen clases `border` ni borde computado visible.
- Dark mode usa base azul noche con blur ambiental cyan/violeta y sombras suaves.
- Light mode conserva legibilidad con overrides específicos para título, lead, métricas y CTA secundario.
- El header público usa `landing-header-surface` y `landing-header-pill` para lograr una barra mate oscura con blur gaussiano y sin bordes blancos visibles.

### Evidencia
- `npm run lint`: aprobado.
- `npm run typecheck`: bloqueado durante `SPEC MERGE` por errores externos en `.next/types/app/api/protected/overview/route.ts` y `.next/types/app/api/protected/portfolio/route.ts`; las rutas fuente no pertenecen al alcance ni fueron modificadas por `SPEC01`.
- `npm run build`: bloqueado por error externo en `app/api/protected/overview/route.ts`; el archivo no pertenece al alcance ni fue modificado por `SPEC01`.
- Captura desktop dark/light en `http://localhost:3000`.
- Captura móvil dark en `http://localhost:3000`: sin overflow horizontal y paneles con borde computado `0px`.
- Captura del header público en `http://localhost:3000`: superficie mate oscura con blur gaussiano y borde computado `0px`.
- Verificación de hover en `http://localhost:3000/marketplace`: el pill activo `Marketplace` conserva espacio superior e inferior al elevarse y no se recorta.
- Verificación light mode: el switch de tema usa gradiente azul/morado en track y thumb, sin amarillo.
- Verificación de microinteracción del switch: el track mantiene transform `none` y delta `0px` en dark/light; el círculo viaja de offset `4px` a `28px`.

### Gates
- Hero dark sin bordes blancos visibles.
- Fondo dark con blur gaussiano aplicado.
- Light mode usable.
- Landing servido localmente para inspección visual.

### SPEC HISTORY
- Lo que quedó estable se documenta como referencia para el cierre de `SPEC01` y para futuros SPECS del landing.
- El sistema visual aceptado usa superficies azul noche, blur gaussiano, gradientes azul/morado, sombras internas y ausencia de bordes blancos.
- Las microinteracciones aceptadas mantienen contenedores estáticos y concentran el movimiento en el elemento accionable: pill activo, botón bajo cursor o círculo del switch.
- La estabilización ocurrió mediante iteración visual local, corrección de artifacts específicos y verificación runtime de medidas concretas.
- Este historial debe revisarse durante `SPEC MERGE` antes de integrar la rama `SPEC` de vuelta a la rama `Feature`.

## ENGLISH VERSION

### Status
- Implementation slice
- Issue: `BRI-168`
- Developer: `czambrano`
- SPEC branch: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Depends on: `knowledge/features/feature-landing-dark-hero-look-and-feel.md`
- Linear source of truth: `BRI-168` issue body

### Goal
Implement the first visual landing slice starting with the dark mode Hero: dark blue background with gaussian blur, internal surfaces without white borders, and continuity with the visual language of the reference.

### Decisions
1. Keep `HeroSection` as a client component because it already depends on i18n and formatted counts.
2. Do not modify the global `Card` component to avoid affecting dashboards, marketplace, admin, and other surfaces.
3. Replace Hero `Card` usage with local borderless panels.
4. Add Hero-specific CSS classes for dark background, ambient blur, and light mode compatibility.
5. Preserve copy, CTAs, routes, dynamic data, and the current image without functional changes.

### Visual Tokens
- Base: nearly black night blue.
- Ambient blur: cyan at the left/top and violet at the right/bottom.
- Panels: dark `rgba` with `backdrop-filter: blur(...)`.
- Shadows: deep and soft, without white outlines.
- Radius: large on the Hero, medium on internal panels.

### Files
- `components/sections/hero.tsx`
- `app/globals.css`

### Implementation Steps
1. Create a local shell class for the dark Hero.
2. Add diffuse pseudo-elements for ambient gaussian blur.
3. Replace internal cards with borderless containers.
4. Adjust the secondary CTA so it has no white border in this Hero.
5. Add specific light mode overrides to preserve legibility.

### Result
- `HeroSection` uses local `landing-hero-*` classes for shell, panels, text, secondary CTA, media overlay, and metrics.
- The Hero no longer depends on the global `Card` component, avoiding impact on dashboards, marketplace, admin, and other surfaces.
- Internal panels have no `border` classes and no visible computed border.
- Dark mode uses a night-blue base with cyan/violet ambient blur and soft shadows.
- Light mode preserves legibility with specific overrides for title, lead, metrics, and secondary CTA.
- The public header uses `landing-header-surface` and `landing-header-pill` to achieve a dark matte gaussian-blur bar without visible white borders.

### Evidence
- `npm run lint`: passed.
- `npm run typecheck`: blocked during `SPEC MERGE` by external errors in `.next/types/app/api/protected/overview/route.ts` and `.next/types/app/api/protected/portfolio/route.ts`; the source routes are outside the scope and were not modified by `SPEC01`.
- `npm run build`: blocked by an external route handler error in `app/api/protected/overview/route.ts`; the file is outside the SPEC01 scope and was not modified by this slice.
- Desktop dark/light capture at `http://localhost:3000`.
- Mobile dark capture at `http://localhost:3000`: no horizontal overflow and panels with computed border `0px`.
- Public header capture at `http://localhost:3000`: dark matte gaussian-blur surface with computed border `0px`.
- Hover verification at `http://localhost:3000/marketplace`: the active `Marketplace` pill keeps top and bottom breathing room while lifting and does not clip.
- Light mode verification: the theme switch uses a blue/purple gradient on track and thumb, with no yellow.
- Switch microinteraction verification: the track keeps transform `none` and `0px` delta in dark/light; the thumb travels from `4px` to `28px` offset.

### Gates
- Dark Hero without visible white borders.
- Dark background with gaussian blur applied.
- Light mode remains usable.
- Landing served locally for visual inspection.

### SPEC HISTORY
- The stable outcome is documented as a reference for closing `SPEC01` and for future landing SPECS.
- The accepted visual system uses night-blue surfaces, gaussian blur, blue/purple gradients, inner shadows, and no white borders.
- Accepted microinteractions keep containers static and concentrate movement on the actionable element: active pill, hovered button, or switch thumb.
- Stabilization happened through local visual iteration, correction of specific artifacts, and runtime verification of concrete measurements.
- This history must be reviewed during `SPEC MERGE` before integrating the `SPEC` branch back into the `Feature` branch.
