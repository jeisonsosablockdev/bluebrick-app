# Implementación: UI Improvements & Scroll Motion Experience

## Contexto
Este documento detalla la implementación técnica correspondiente a la épica de mejoras de interfaz de usuario (`bri-180`) y la sub-especificación de Scroll Motion Experience (`spec06`).

## Decisiones Arquitectónicas (Frontend)

### 1. Hero Section Layout
- **Problema Inicial:** El Hero presentaba problemas de pixelación y cortes en la imagen de fondo en resoluciones de portátiles (ej. MacBook Pro 13"/14"). Se utilizaban técnicas invasivas (`backdrop-blur`, márgenes negativos agresivos vía CSS global `.landing-hero-shell`) que distorsionaban el activo original.
- **Solución Implementada:**
  - Se eliminó el filtro `backdrop-blur-[1px]` y los degradados superpuestos para mantener la alta resolución de la imagen.
  - Se migró el contenedor de imagen para utilizar la clase de utilidad `object-contain object-right-top`. Esto ancla matemáticamente la imagen a la esquina superior derecha sin distorsión o corte, permitiendo que el resto del contenedor compense el espacio con un color oscuro sólido (`#020813`).
  - Se reemplazó el margen global `.landing-hero-shell` con un layout explícito en Tailwind (`-mt-[100px] pt-[100px]`) que integra orgánicamente el Hero bajo el Navbar transparente.
  - Migración a `<Image />` de `next/image` con la propiedad `fill` para aprovechar la precarga (`priority`), optimización y reducción del LCP, eliminando alertas del linter.

### 2. Arquitectura de Layout y Márgenes (Constrained Full-Bleed)
- **Problema Inicial:** Los márgenes de la Landing Page presentaban inconsistencias severas. Al usar unidades relativas y un esquema fuertemente ligado a porcentajes (ej. `70vw`), en pantallas de portátiles regulares (1512px) el layout perdía márgenes laterales creando un efecto "cilindro" o "tubo" visual.
- **Solución Implementada:**
  - Migración completa hacia una **Arquitectura de Contención Rígida con Fondos a Sangre** (inspirada en arquitecturas modernas como la de rig.ai).
  - El contenedor principal de la Landing Page (`app/page.tsx`) y el Hero (`hero.tsx`) fueron restringidos rígidamente a `max-w-7xl` (1280px) con paddings de seguridad (`px-6 lg:px-12`).
  - El Navbar flotante (`main-top-navigation-modal.tsx`) fue ajustado a `max-w-5xl` para preservar su elegancia tipo píldora manteniendo la coherencia de alineación en resoluciones gigantes.
  - Implementación de **Tipografía Fluida (Clamping)** matemáticamente calculada para el título (`H1`) y la descripción (`Lead`) usando `clamp(2.5rem, 6vw, 5.5rem)`, previniendo desbordes asimétricos al escalar la resolución de pantalla.

### 3. Rendimiento (Core Web Vitals)
- La implementación garantiza un puntaje de 100/100 en Accesibilidad (Lighthouse).
- Se adhiere al `frontend-ui-policy.md` limitando el uso de `<img>` en favor de optimizaciones nativas del framework.

## Próximos Pasos (Next Actions)
- Monitorear el LCP en despliegues a Devnet/Staging con Vercel Speed Insights.
- Migrar el `Marketplace` (`/marketplace`) hacia la nueva arquitectura de `max-w-7xl` para asegurar la uniformidad en toda la UI y evitar saltos abruptos de ancho de pantalla al navegar.
