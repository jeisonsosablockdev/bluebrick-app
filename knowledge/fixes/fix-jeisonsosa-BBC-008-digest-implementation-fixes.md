# Problem Spec: digest-implementation-fixes

## What problem exists
Existen tres problemas y mejoras técnicas a resolver en este ciclo:
1. **Login Fallback con WorkOS**: Al iniciar sesión con una cuenta de Google mediante WorkOS, el usuario era enviado a un perfil genérico porque la aplicación hacía fallback a datos semilla ("seeded initial portfolio fixtures"). Esto ocurría por variables de entorno desincronizadas y hardcoding de usuario demo.
2. **Dependencias y Adaptadores de Solana Obsoletos**: La aplicación incluía `@solana/wallet-adapter` que causaba warnings de standard wallet en el navegador e incrementaba innecesariamente el peso del bundle.
3. **Deprecación de `middleware.ts` en Next.js 16**: Next.js 16 emite una advertencia de deprecación (`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead`) solicitando migrar a la convención moderna `proxy.ts`.

## Why it matters
1. El login fallido bloqueaba a los usuarios reales para acceder a su portafolio real.
2. Los adaptadores de Solana innecesarios generaban ruido en consola y dependencias muertas.
3. La convención deprecated de middleware puede romperse en futuras actualizaciones menores de Next.js 16 y genera advertencias en el build y servidor de desarrollo.

## What outcome is expected
- La conexión a base de datos y la sesión de WorkOS funcionan limpiamente en el dashboard.
- Todos los paquetes y referencias a `@solana/wallet-adapter` han sido purgados.
- El archivo `apps/web/src/middleware.ts` es migrado a `apps/web/src/proxy.ts` de acuerdo a la convención oficial de Next.js 16 / AuthKit, eliminando el warning de deprecación y verificando con `next-dev-loop`.

## What gaps exist today
- `apps/web/src/middleware.ts` aún utiliza el nombre antiguo y requiere renombrarse a `apps/web/src/proxy.ts`.
- Pruebas estructurales como `tests/unit/workos-auth-structural.test.ts` deben actualizarse para validar `proxy.ts`.

## What questions remain open
- Ninguna pregunta abierta; la convención de `proxy.ts` está estandarizada en Next.js 16.
