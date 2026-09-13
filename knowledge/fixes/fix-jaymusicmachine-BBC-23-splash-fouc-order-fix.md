# Problem Spec: splash-fouc-order-fix (BBC-23)

## What problem exists
Al acceder a `https://portal.bluebrick.capital` o al entorno de desarrollo, la aplicación web presenta un destello de contenido no estilizado/no protegido (FOUC) durante el arranque: el navegador recibe el HTML pre-renderizado del servidor con la landing page completa (Hero, tarjetas 2x2, tarjeta de login) y la pinta inmediatamente en pantalla (Frame 0). Cientos de milisegundos después, tras completarse la descarga y ejecución asíncrona del bundle dinámico de cliente de `BrandSplashScreen` (`next/dynamic` con `{ ssr: false }`) y `motion/react`, el overlay del splash screen se monta súbitamente cubriendo la página. El usuario percibe que la página se alcanza a ver antes de que arranque el splash screen, evidenciando un orden de carga incorrecto.

## Why it matters
La primera impresión visual de la marca y la experiencia de usuario se ven gravemente comprometidas por el parpadeo de contenido. La intención de diseño del splash screen es sumergir al inversor en la atmósfera de marca con el fondo oscuro canónico (`#020813`) y presentar la coreografía vectorial progresiva del isotipo tipográfico antes de mostrar el contenido institucional. El flash previo de la landing rompe la inmersión, genera desconfianza y distorsiona el ritmo visual.

## What outcome is expected
1. **Arranque garantizado en Frame 0 con el color base (#020813)**: La aplicación web nace completamente cubierta por el telón de fondo de la marca en el HTML inicial. Cero milisegundos de visualización de la landing page antes del splash screen.
2. **Bypass instantáneo en visitas repetidas**: En visitas subsecuentes dentro de la misma sesión de navegación (`sessionStorage.getItem("bluebrick_splash_viewed") === "true"`), un script inline síncrono en `<head>` previene el pintado del telón antes de que el navegador procese el `<body>`, permitiendo navegación instantánea sin FOUC de splash.
3. **Transición coordinada y fluida**: Al finalizar los 5 segundos de retención y la rotación 3D del isotipo, el splash screen y el telón base se desvanecen sincronizadamente en un fade-out suave hacia la landing page.
4. **Validación técnica y suite en verde**: Pruebas unitarias de regresión y 100% de cumplimiento en los 16 gates de `pnpm validate`.

## What gaps exist today
1. `BrandSplashScreen` está desacoplado mediante `next/dynamic` con `{ ssr: false }` y montado en `SplashPortal` sobre `document.body` (cliente exclusivo), lo que excluye por completo el overlay protector del HTML generado en SSR.
2. No existe un contenedor estático de telón (*SSR Shell Curtain*) con `z-index: 9999` y fondo `#020813` en el árbol de layout inicial que cubra el viewport antes de la hidratación de JavaScript.
3. No existe un mecanismo de pre-pintado en `<head>` para detectar `sessionStorage` y aplicar una clase de bypass (`.splash-bypassed`) antes del renderizado del DOM del `<body>`.

## What questions remain open
- Ninguna pregunta abierta. El diseño de la coreografía de 4 piezas, retención de 5 segundos, aceleración GPU y paleta de colores ya fue validado y aprobado; el cambio se enfoca exclusivamente en la arquitectura de montaje en Frame 0 para eliminar el FOUC.

