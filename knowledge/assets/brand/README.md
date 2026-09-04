---
type: Guide
title: BlueBrick Brand Assets & Visual Identity Specification
description: Canonical specification and catalog for BlueBrick brand graphic elements, color palette, vector geometry, and shared public assets.
tags: [brand, assets, design-system, ui, graphics]
timestamp: 2026-09-03T23:10:00Z
resource: local
---

# BlueBrick Visual Identity & Brand Assets

Este documento establece la especificación canónica y el catálogo oficial de los elementos gráficos compartidos de la marca **BlueBrick**, garantizando coherencia visual en todas las superficies públicas, privadas, interfaces de usuario y documentación del monorepo.

---

## 1. Catálogo de Archivos Compartidos Comunes

Los archivos gráficos de la marca residen en dos ubicaciones canónicas según su propósito:
1. **Documentación y SSOT de Diseño**: `knowledge/assets/brand/`
2. **Servicio Estático de la Aplicación Web (Next.js)**: `apps/web/public/brand/` (accesibles en tiempo de ejecución como `/brand/...`)

| Archivo | Formatos Disponibles | Dimensiones | Descripción y Caso de Uso |
| :--- | :--- | :--- | :--- |
| **`bluebrick-logo-horizontal`** | `.svg`, `.png` | 892 × 168 px | **Logotipo Completo Horizontal:** Combina el isotipo de 4 barras a la izquierda con la tipografía "Blue Brick" a la derecha en formato vectorial SVG y PNG de alta resolución. Ideal para cabeceras principales, hero de bienvenida, reportes PDF y presentaciones. |
| **`bluebrick-logo-horizontal-white`** | `.svg`, `.png` | 892 × 168 px | **Logotipo Completo Horizontal (Blanco):** Versión negativa vectorial para fondos oscuros y cabeceras Dark Mode. |
| **`bluebrick-mark-dark`** | `.svg`, `.png` | 160 × 168 px (SVG) / 512 × 512 px (PNG) | **Isotipo Versión Primaria (Fondos Claros):** 3 barras azul marino profundo + 1 barra de acento roja. Diseñado para fondos blancos o claros (Light Mode), papelería y sellos de plataforma. |
| **`bluebrick-mark-white`** | `.svg`, `.png` | 160 × 168 px (SVG) / 512 × 512 px (PNG) | **Isotipo Versión Negativa (Fondos Oscuros):** 3 barras blancas + 1 barra de acento roja. Diseñado para el tema oscuro (Dark Mode), barras de navegación nocturnas (`#0A1220`) y modales glassmorphic. |

---

## 2. Paleta de Colores Oficial (Muestreo Exacto)

La identidad de BlueBrick se basa en un contraste institucional sobrio entre azul marino arquitectónico, acento rojo carmesí de alta energía y blanco puro:

| Token / Nombre | Hex | RGB | Muestra | Rol y Aplicación |
| :--- | :--- | :--- | :---: | :--- |
| **BlueBrick Crimson Red** | `#FC040C` | `rgb(252, 4, 12)` | 🔴 | Barra de acento (cuarta barra), elementos de llamado a la acción (CTA) y acentos de marca. |
| **BlueBrick Deep Navy** | `#04283C` | `rgb(4, 40, 60)` | 🔵 | Barras estructurales principales (Light Mode) y tipografía de logotipo (`#102838`). |
| **BlueBrick White** | `#FFFFFF` | `rgb(255, 255, 255)` | ⚪ | Barras estructurales principales en Dark Mode y textos de alto contraste. |
| **BlueBrick Canvas Grey** | `#F7F7F7` | `rgb(247, 247, 247)` | ◽ | Fondo neutral base utilizado en las exportaciones de prueba y lienzos claros. |

---

## 3. Anatomía y Geometría del Emblema

El isotipo está compuesto por 4 barras redondeadas tipo cápsula (*stadium/pill bars*) dispuestas en ángulo diagonal (~ -24° de inclinación respecto a la vertical):

```
       [4: Rojo Carmesí #FC040C]
      /
    [3: Marino #04283C / Blanco #FFFFFF] (Barra más alta)
   /
 [2: Marino #04283C / Blanco #FFFFFF] (Barra media)
/
[1: Marino #04283C / Blanco #FFFFFF] (Barra corta)
```

- **Barra 1 (Izquierda inferior):** Altura corta, base alineada, color estructural.
- **Barra 2 (Centro-izquierda):** Altura media, color estructural.
- **Barra 3 (Centro-derecha):** Altura máxima, color estructural.
- **Barra 4 (Extremo superior-derecha):** Altura media, desplazada hacia la parte superior, color de acento rojo vibrante.

---

## 4. Puntos de Integración en el Frontend

Para reemplazar los antiguos elementos gráficos provisionales (emulaciones CSS aproximadas), se deben actualizar los siguientes componentes:

1. **`apps/web/src/components/dashboard/blue-brick-mark.tsx`**:
   - Reemplazar la configuración legacy de gradientes plateados/rojos con el isotipo oficial vectorizado o imagen transparente `/brand/bluebrick-mark-white.png` (en Dark Mode) y `/brand/bluebrick-mark-dark.png` (en Light Mode).
2. **`apps/web/src/components/landing/landing-hero.tsx`**:
   - Incorporar el nuevo logotipo horizontal o el isotipo con tipografía oficial.
3. **`apps/web/src/app/icon.tsx` y `apps/web/src/app/apple-icon.tsx`**:
   - Actualizar los generadores de favicons de Next.js para renderizar los colores oficiales (`#04283C` y `#FC040C`).
4. **`apps/web/src/app/opengraph-image.tsx` y `twitter-image.tsx`**:
   - Reemplazar el banner social con la nueva composición del logotipo.
5. **`tailwind.config.ts`**:
   - Sincronizar la paleta de Tailwind con los tokens oficiales de BlueBrick.

---

## 5. Reglas de Uso y Restricciones
- 🚫 **No distorsionar la relación de aspecto**: Mantener siempre la proporción de escala del isotipo.
- 🚫 **No cambiar el orden de los colores**: La barra de acento roja siempre debe ocupar la cuarta posición superior-derecha.
- 🚫 **No utilizar la versión blanca sobre fondos claros**: Usar siempre `bluebrick-mark-dark` sobre fondos claros y `bluebrick-mark-white` sobre fondos oscuros.
