---
type: Feature Spec
title: Feature Landing Dark Hero Look And Feel
description: Feature Landing Dark Hero Look And Feel - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-168/feature-landing-dark-hero-look-and-feel.md
---

# Feature Note: Landing Dark Hero Look And Feel

## VERSION ESPAÑOL

### Status
- SPEC slice
- Issue: `BRI-168`
- Developer: `czambrano`
- Rama SPEC: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Linear source of truth: cuerpo del issue `BRI-168`
- Local source: `knowledge/features/feature-landing-dark-hero-look-and-feel.md`

### Objetivo
Actualizar el look and feel del landing en modo oscuro para acercarlo a la referencia visual provista: superficies oscuras, blur gaussiano, glow azul/morado y recuadros sin bordes blancos visibles.

### Intención de producto
- El Hero debe sentirse más premium, oscuro y continuo con la barra superior existente.
- Los recuadros internos deben leerse como capas glass oscuras, no como tarjetas delineadas.
- El cambio empieza por el Hero y deja preparado el criterio visual para retirar bordes blancos del resto del landing en slices posteriores.

### Dirección visual
- Fondo dark con base azul noche.
- Luces difusas azul/cyan y violeta aplicadas como blur ambiental.
- Cápsulas y paneles con transparencia oscura.
- Sin contornos blancos visibles en los recuadros principales.
- Contraste suficiente en texto, CTA y métricas.

### Alcance del primer slice
- `components/sections/hero.tsx`
- `app/globals.css`
- Fondo dark mode del Hero.
- Panel de imagen del Hero sin borde blanco.
- Paneles de métricas del Hero sin borde blanco.
- CTA secundario del Hero sin borde blanco visible.

### Fuera de alcance
- Rediseñar toda la arquitectura del landing.
- Cambiar copy, traducciones o rutas.
- Cambiar light mode más allá de mantener compatibilidad visual.
- Remover bordes del resto de secciones del landing; eso queda para SPECS posteriores.

### Criterios de aceptación
- En dark mode, el Hero usa un fondo azul oscuro con blur gaussiano ambiental.
- Los recuadros del Hero no muestran bordes blancos.
- El Hero mantiene el mismo contenido, orden, CTAs y datos dinámicos.
- La versión light sigue siendo usable y no queda forzada a una superficie oscura.
- El cambio es local al Hero y no altera componentes globales como `Card`.

### Validación
- Verificar `/` en `http://localhost:3000`.
- Revisar dark mode contra la referencia visual.
- Confirmar que el contenido del Hero no se desborda en desktop.
- Ejecutar una validación enfocada de lint/type si el alcance lo permite.

### Evidencia SPEC01
- `npm run lint`: aprobado.
- `npm run typecheck`: bloqueado durante `SPEC MERGE` por errores externos en `.next/types/app/api/protected/overview/route.ts` y `.next/types/app/api/protected/portfolio/route.ts`; las rutas fuente no pertenecen al alcance ni fueron modificadas por `SPEC01`.
- `npm run build`: bloqueado por error externo en `app/api/protected/overview/route.ts`; el archivo no pertenece al alcance ni fue modificado por `SPEC01`.
- Inspección visual en `http://localhost:3000`: dark mode y light mode revisados con capturas desktop.
- Inspección responsive móvil: sin overflow horizontal; los paneles del Hero reportan borde computado `0px`.
- Ajuste visual solicitado: header público con fondo oscuro mate, blur gaussiano y sin bordes blancos computados en shell, pills, selector de idioma y toggle de tema.
- Corrección puntual: el pill `Marketplace` elimina la sombra exterior rectangular y mantiene profundidad con sombras internas redondeadas.
- Corrección puntual active state: el pill activo de `Marketplace` en modo oscuro elimina la sombra exterior rectangular y usa profundidad interna redondeada con borde computado `0px`.
- Corrección puntual light mode: el pill del logo BRIDS usa el mismo tratamiento oscuro mate del dark mode y elimina el gris plano anterior.
- Corrección puntual light mode refinada: el pill del logo BRIDS usa un azul noche sólido equivalente al color de referencia para evitar que se lave a gris sobre el fondo claro.
- Microinteracción del header: los pills del Hero/header adoptan la misma sensación del botón `Ingresar`, con elevación suave en hover, presión en active y fallback para `prefers-reduced-motion`.
- Corrección de glitch: el theme toggle ya no anima todo el recuadro al pasar sobre el label; la microinteracción ocurre solo al pasar sobre el switch.
- Corrección de glitch: el selector de idioma ya no anima todo el contenedor; la microinteracción ocurre solo sobre el botón de idioma bajo el cursor.
- Corrección de margen: el contenedor de navegación desktop agrega respiración vertical para que el pill activo `Marketplace` pueda elevarse en hover sin recortarse.
- Corrección light mode: el switch de tema reemplaza el amarillo por el gradiente azul/morado de BRIDS en track y thumb.
- Corrección de microinteracción del switch: el track interno queda anclado en una columna fija, permanece estático entre estados dark/light y el círculo es el único elemento que viaja y anima hover/press.
- Observación fuera de alcance: cualquier rediseño estructural del header móvil se documenta para el scope de Header/Dropdown, no para este SPEC.

### SPEC HISTORY
- Resultado estable: el Hero dark mode quedó alineado con la referencia visual usando fondo oscuro mate, blur gaussiano y glows azul/morado.
- Resultado estable: los recuadros del Hero y header eliminan bordes blancos visibles sin perder contraste ni jerarquía.
- Resultado estable: el header público usa una superficie premium con profundidad interna, sin sombras cuadradas o contornos duros.
- Resultado estable: el pill `Marketplace` mantiene calidad visual en estado idle, active y hover, sin recorte ni sombra rectangular.
- Resultado estable: el logo BRIDS en light mode conserva el tratamiento azul noche validado en dark mode.
- Resultado estable: el switch de tema usa gradiente BRIDS, mantiene el track estático y mueve únicamente el círculo entre estados.
- Resultado estable: el selector de idioma anima solo el botón bajo el cursor, no el contenedor completo.
- Patrón reutilizable: los elementos tipo pill deben preferir profundidad interna, gradientes suaves, radios completos y movimiento mínimo del elemento accionable.
- Patrón reutilizable: si un label cambia de longitud, el control visual debe quedar anclado en una columna fija para evitar desplazamientos perceptibles.
- Evidencia de estabilidad: lint aprobado, inspección visual local y mediciones runtime confirmaron ausencia de bordes, ausencia de recortes y switch track con delta `0px`.

## ENGLISH VERSION

### Status
- SPEC slice
- Issue: `BRI-168`
- Developer: `czambrano`
- SPEC branch: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`
- Linear source of truth: `BRI-168` issue body
- Local source: `knowledge/features/feature-landing-dark-hero-look-and-feel.md`

### Objective
Update the landing page look and feel in dark mode to match the provided visual reference: dark surfaces, gaussian blur, blue/purple glow, and informational panels without visible white borders.

### Product Intent
- The Hero should feel more premium, darker, and visually continuous with the existing top bar.
- Internal panels should read as dark glass layers, not outlined cards.
- The change starts with the Hero and establishes the visual criteria for removing white borders from the rest of the landing page in later slices.

### Visual Direction
- Dark background with a night-blue base.
- Diffuse blue/cyan and violet lights applied as ambient blur.
- Capsules and panels with dark transparency.
- No visible white outlines on the main panels.
- Sufficient contrast for text, CTAs, and metrics.

### First Slice Scope
- `components/sections/hero.tsx`
- `app/globals.css`
- Hero dark mode background.
- Hero image panel without white border.
- Hero metric panels without white border.
- Hero secondary CTA without visible white border.

### Out Of Scope
- Redesigning the full landing architecture.
- Changing copy, translations, or routes.
- Changing light mode beyond preserving visual compatibility.
- Removing borders from the rest of the landing sections; that belongs to later SPECS.

### Acceptance Criteria
- In dark mode, the Hero uses a dark blue background with ambient gaussian blur.
- Hero panels do not show white borders.
- The Hero preserves the same content, order, CTAs, and dynamic data.
- Light mode remains usable and is not forced into a dark surface.
- The change is local to the Hero and does not alter global components like `Card`.

### Validation
- Verify `/` at `http://localhost:3000`.
- Review dark mode against the visual reference.
- Confirm Hero content does not overflow on desktop.
- Run focused lint/type validation when the scope allows it.

### SPEC01 Evidence
- `npm run lint`: passed.
- `npm run typecheck`: blocked during `SPEC MERGE` by external errors in `.next/types/app/api/protected/overview/route.ts` and `.next/types/app/api/protected/portfolio/route.ts`; the source routes are outside the scope and were not modified by `SPEC01`.
- `npm run build`: blocked by an external route handler error in `app/api/protected/overview/route.ts`; the file is outside the SPEC01 scope and was not modified by this slice.
- Visual inspection at `http://localhost:3000`: dark mode and light mode reviewed with desktop captures.
- Mobile responsive inspection: no horizontal overflow; Hero panels report computed border `0px`.
- Requested visual adjustment: public header with dark matte background, gaussian blur, and no computed white borders on shell, pills, language selector, or theme toggle.
- Focused correction: the `Marketplace` pill removes the rectangular outer shadow and keeps depth with rounded inner shadows.
- Focused active-state correction: the active `Marketplace` pill in dark mode removes the rectangular outer shadow and uses rounded inner depth with computed border `0px`.
- Focused light mode correction: the BRIDS logo pill uses the same dark matte treatment from dark mode and removes the previous flat gray look.
- Refined light mode correction: the BRIDS logo pill uses a solid night-blue tone matching the reference color to avoid washing into gray over the light background.
- Header microinteraction: Hero/header pills adopt the same feel as the `Sign in` button, with subtle hover lift, active press, and a `prefers-reduced-motion` fallback.
- Glitch correction: the theme toggle no longer animates the full control when hovering the label; the microinteraction only runs when hovering the switch.
- Glitch correction: the language selector no longer animates the full container; the microinteraction only runs on the language button under the cursor.
- Spacing correction: the desktop navigation container adds vertical breathing room so the active `Marketplace` pill can lift on hover without being clipped.
- Light mode correction: the theme switch replaces yellow with the BRIDS blue/purple gradient on both track and thumb.
- Switch microinteraction correction: the inner track is anchored in a fixed column, stays static between dark/light states, and the thumb circle is the only element that travels and animates hover/press.
- Out-of-scope observation: any structural redesign of the mobile header is documented for the Header/Dropdown scope, not this SPEC.

### SPEC HISTORY
- Stable outcome: the dark mode Hero now matches the visual reference with a matte dark background, gaussian blur, and blue/purple glows.
- Stable outcome: Hero and header cards remove visible white borders without losing contrast or hierarchy.
- Stable outcome: the public header uses a premium surface with inner depth, without square shadows or hard outlines.
- Stable outcome: the `Marketplace` pill keeps visual quality in idle, active, and hover states without clipping or rectangular shadow artifacts.
- Stable outcome: the BRIDS logo in light mode keeps the validated night-blue treatment from dark mode.
- Stable outcome: the theme switch uses the BRIDS gradient, keeps the track static, and moves only the thumb between states.
- Stable outcome: the language selector animates only the button under the cursor, not the full container.
- Reusable pattern: pill-like elements should prefer inner depth, soft gradients, full-radius surfaces, and minimal movement on the actionable element.
- Reusable pattern: when a label changes length, the visual control must be anchored in a fixed column to avoid perceptible shifts.
- Stability evidence: approved lint, local visual inspection, and runtime measurements confirmed no borders, no clipping, and switch track delta `0px`.
