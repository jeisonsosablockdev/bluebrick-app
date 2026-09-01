# Problem Spec: dashboard-microanimations (BBC-016 / BBC-16)

## What problem exists
El Dashboard del inversionista de BlueBrick actualmente presenta una interfaz funcional y responsiva, pero estática en sus componentes clave (Hero Cards de patrimonio y distribución, carrusel de proyectos de inversión, stepper de fases de obra, tabla de detalles y banners de reinversión). 
La falta de respuesta háptica visual y microinteracciones de proximidad reduce la sensación de dinamismo, modernidad y "recompensa visual" (engagement dopamínico) esperada en plataformas fintech e inmobiliarias de lujo institucional. Además, cualquier introducción descuidada de animaciones en la web corre el riesgo de degradar los **Web Core Vitals** (específicamente causando **CLS** [Cumulative Layout Shift] por recalcular cajas de layout, o aumentando **INP** [Interaction to Next Paint] por sobrecargar el hilo principal con eventos de mouse no optimizados).

## Why it matters
1. **Engagement y Retención de Inversionistas**: Las microinteracciones sutiles pero táctiles ("juicy UI") al interactuar con activos de alto valor generan satisfacción y confianza en la plataforma sin caer en estridencias visuales que resten seriedad institucional.
2. **Cumplimiento Estricto de Web Core Vitals**: 
   - **CLS = 0**: Todo escalado debe ser estrictamente transformacional (`transform: scale(...)`, `translateY(...)`) en la capa del compositor de la GPU, garantizando cero desplazamiento de elementos circundantes.
   - **INP < 50ms**: La respuesta a eventos de puntero (`:hover`, `:active`, `whileHover`, `whileTap`) debe responder en el frame inmediato (< 16ms) sin recalcular layouts en CPU.
   - **LCP y FID Inalterados**: Cero retraso en el First Paint o renderizado inicial de cards y métricas.
   - **Accesibilidad (`prefers-reduced-motion`)**: Inversionistas con preferencias de reducción de movimiento deben recibir transiciones de color/opacidad sin movimiento físico.

## What outcome is expected
1. **Micro-Escalado y Elevación de Cards y Elementos**:
   - Hero Cards (Patrimonio Total y Distribución de Portafolio): Escalado sutil `scale(1.008)` con suave elevación `translateY(-2px)` y resplandor perimetral fino (`box-shadow` suave / border glow) al acercar el puntero.
   - Stat Chips (`StatChip`): Elevación `translateY(-2px)` con iluminación de acento en el icono y fondo al pasar el cursor.
   - Carrusel de Inversión y Controles: Botones de navegación (Chevron) con rebote elástico (`scale(1.12)` en hover, `scale(0.92)` en tap) y micro-zoom `scale(1.005)` en la tarjeta del proyecto.
   - Stepper de Fases de Obra (`ProjectPhaseProgress`): Hitos interactivos con pulso de hover elástico `scale(1.28)` y zoom sutil `scale(1.04)` en miniaturas multimedia con clipping por GPU.
   - Oportunidades de Reinversión y Botón CTA: Cards de oportunidad con `scale(1.02)` y elevación; botón principal ("Explorar Oportunidades") con pulso dopamínico, brillo de gradiente y `whileTap: scale(0.97)`.
   - Fila de Tabla de Detalles: Resaltado sutil de fila con `background` y micro-transición en iconos de tipología.
2. **Tokens de Animación y Física Spring en Motion 12**:
   - Constantes centralizadas para físicas elásticas fluidas (`stiffness: 350`, `damping: 25`, o curvas bezier `cubic-bezier(0.16, 1, 0.3, 1)`).
   - Inclusión de hook `useReducedMotion` o estilos condicionales con soporte completo de accesibilidad.
3. **Cero Regresión y Validación al 100%**:
   - `pnpm validate` pasa con 0 errores de TypeScript, 0 errores de ESLint, 0 alertas de licencias y suite de tests completa en verde.

## What gaps exist today
- `investment-dashboard.tsx` y sus subcomponentes (`stat-chip.tsx`, `metric-row.tsx`) tienen estilos CSS planos estáticos sin propiedades de transformación o transiciones en hover.
- Los botones y cards carecen de feedback de presión (`:active` / `whileTap`).
- No existe un módulo de tokens de microanimación (`micro-animation-tokens.ts`) ni un wrapper reusable de tarjeta interactiva con aceleración por GPU (`interactive-card.tsx`).
- Falta cobertura de tests unitarios que verifique las propiedades de transformación y el respeto a Core Web Vitals y accesibilidad.

## What questions remain open
- Ninguna. La dirección de diseño está claramente definida: microanimaciones sutiles y elegantes, sensación dopamínica pero no exagerada, y respeto riguroso a Web Core Vitals.
