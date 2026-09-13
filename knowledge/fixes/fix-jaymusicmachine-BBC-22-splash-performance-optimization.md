# Problem Spec: Splash Screen Performance Optimization, Instant Shell & GPU Acceleration (BBC-22)

## What problem exists
El startup splash screen implementado en `BBC-21` presenta fricciones de rendimiento percibido y técnico que lo hacen sentir "pesado al cargar":
1. **Brecha de Hidratación (Hydration Lag)**: El componente depende de `SplashPortal` y `useSyncExternalStore` (`isClient`). Como resultado, en el HTML inicial (SSR) no se renderiza ningún elemento del splash. El usuario debe esperar a que el navegador descargue, parseé y ejecute todos los bundles de JavaScript (React 19, Next.js, WorkOS, Solana Web3, Motion 12) antes de que el splash aparezca, produciendo una pantalla en blanco o flash de contenido.
2. **Sobrecarga en el Chunk Crítico de Providers**: `BrandSplashScreen` está importado de forma síncrona en `apps/web/src/app/providers.tsx`. Esto incorpora el runtime completo de `motion/react` y el vector tipográfico de 5 KB (`WORDMARK_PATH_DATA`) en el bundle crítico inicial de la aplicación, penalizando el Time to Interactive (TTI) y First Contentful Paint (FCP) incluso para usuarios recurrentes que ya vieron el splash en su sesión.
3. **Renderizado 3D en SVG y CPU Rasterization**: En `animated-isotype-vector.tsx`, las propiedades de perspectiva 3D (`perspective: 800`, `transformStyle: "preserve-3d"`, `rotateY: 180deg`) están aplicadas directamente a `<motion.svg>` y `<motion.path>`. Los motores de renderizado (especialmente WebKit/Safari en macOS e iOS) no aceleran por GPU las transformaciones 3D sobre primitivas SVG, provocando recálculo y re-rasterización cuadro por cuadro en la CPU, lo que genera caídas de frames (micro-tirones).
4. **Montaje Fantasma en Visitas Recurrentes**: En `use-splash-screen.ts`, el estado inicial `isVisible` comienza en `true`. La verificación de `sessionStorage` ocurre dentro de un `useEffect` asíncrono, montando innecesariamente el árbol de Motion antes de ser apagado milisegundos después.
5. **Competición de Red durante la Precarga**: La inyección de enlaces `<link rel="prefetch">` se realiza en paralelo durante la fase activa de retención sin verificar la inactividad de la red o CPU (`requestIdleCallback`).

## Why it matters
El splash screen es la primera impresión de la plataforma BlueBrick para inversionistas institucionales y usuarios.
- Si el splash tarda en aparecer o titubea en 3D, transmite una sensación de lentitud ("pesado al cargar") que daña la percepción de calidad del producto.
- A nivel de Core Web Vitals, cargar bibliotecas de animación pesadas en el bundle crítico degrada el FCP, LCP y Total Blocking Time (TBT).
- Resolver esto garantiza una experiencia inmediata (0ms), con rotación 3D fluida a 60/120 FPS en GPU nativa y cero impacto de bundle para usuarios que ya vieron el splash.

## What outcome is expected
1. **Instant Paint Shell (FCP ~0ms)**: El fondo `#020813` y el contenedor inicial de marca se muestran de inmediato en el HTML crítico sin esperar a la hidratación de React.
2. **Bundle Desacoplado con Dynamic Import**: `BrandSplashScreen` se carga de forma diferida en cliente (`next/dynamic`, `ssr: false`), liberando el bundle principal de `Providers`.
3. **Aceleración por Hardware GPU en 3D**: La rotación axial de 180° se ejecuta sobre un contenedor DOM (`div`) con `transformStyle: "preserve-3d"`, `will-change: transform` y `backface-visibility: hidden`, delegando la transformación al compositor de la GPU sin re-rasterización SVG en CPU.
4. **Bypass Síncrono en Visitas Recurrentes**: Detección temprana de sesión que previene el montaje y renderizado fantasma de Motion en visitas repetidas.
5. **Precarga en Reposo con `requestIdleCallback`**: La precarga de rutas críticas (`/dashboard`, `/auth/login`) se difiere a momentos de inactividad de la CPU y la red.
6. **100% de Pruebas Pasando**: Cobertura exhaustiva en Vitest, arquitectura en 4 capas aprobada por `architect`, y `pnpm validate` con 0 errores.

## What gaps exist today
- `apps/web/src/app/providers.tsx`: Importación síncrona de `BrandSplashScreen`.
- `apps/web/src/components/splash/splash-portal.tsx`: Ausencia de fallback pre-hidratación.
- `apps/web/src/components/splash/animated-isotype-vector.tsx`: Transformaciones 3D aplicadas a etiquetas SVG y path en vez de contenedor DOM acelerado.
- `apps/web/src/components/splash/use-splash-screen.ts`: Verificación diferida de bypass en `useEffect` y precarga no sujeta a inactividad.
- `apps/web/src/lib/splash/load-optimizer.ts`: Falta de envoltorio con `requestIdleCallback` para `prefetchCriticalRoutes`.

## What questions remain open
- Ninguna. La coreografía visual aprobada (4 piezas, 5 segundos de hold, giro a paleta secundaria y palabra oficial en vector) se preserva intacta al 100%; los cambios son puramente de optimización de rendimiento, arquitectura y aceleración por GPU.
