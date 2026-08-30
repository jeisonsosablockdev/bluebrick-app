# Problem Spec: digest-implementation-fixes

## What problem exists
Existen cuatro problemas y mejoras técnicas a resolver en este ciclo:
1. **Login Fallback con WorkOS**: Al iniciar sesión con una cuenta de Google mediante WorkOS, el usuario era enviado a un perfil genérico porque la aplicación hacía fallback a datos semilla ("seeded initial portfolio fixtures"). Esto ocurría por variables de entorno desincronizadas y hardcoding de usuario demo.
2. **Dependencias y Adaptadores de Solana Obsoletos**: La aplicación incluía `@solana/wallet-adapter` que causaba warnings de standard wallet en el navegador e incrementaba innecesariamente el peso del bundle.
3. **Deprecación de `middleware.ts` en Next.js 16**: Next.js 16 emite una advertencia de deprecación (`⚠ The "middleware" file convention is deprecated. Please use "proxy" instead`) solicitando migrar a la convención moderna `proxy.ts`.
4. **Desconexión de Datos Ingeridos del Excel en el Dashboard**: El pipeline de AI Ingestion procesó y persistió exitosamente los 10 inversionistas del Excel de Google Drive en la tabla `clients`, pero el Dashboard (`InvestmentRepository`) solo consultaba la tabla `user_investments`. Como consecuencia, cuando un usuario autenticado (ej. `jeisonjsosar@gmail.com`) entra a `/dashboard`, el sistema no encontraba inversiones vinculadas y caía en el fallback estático de Bogotá ($163,000 USD).

## Why it matters
1. El login fallido bloqueaba a los usuarios reales para acceder a su portafolio real.
2. Los adaptadores de Solana innecesarios generaban ruido en consola y dependencias muertas.
3. La convención deprecated de middleware puede romperse en futuras actualizaciones de Next.js 16.
4. Los inversionistas reales esperan ver de inmediato su inversión real, proyecto asignado en Tampa, montos y rendimientos reales obtenidos del Excel al ingresar a la plataforma.

## What outcome is expected
- La conexión a base de datos y la sesión de WorkOS funcionan limpiamente en el dashboard.
- Todos los paquetes y referencias a `@solana/wallet-adapter` han sido purgados.
- El archivo `apps/web/src/middleware.ts` es migrado a `apps/web/src/proxy.ts` de acuerdo a Next.js 16.
- El repositorio `InvestmentRepository` y `DashboardPage` resuelven las inversiones buscando por el correo electrónico del usuario autenticado en la tabla `clients`, proyectando su portafolio real (ej. Jayson Sosa: $50,000 USD en Carrollwood, Tampa al 15.0% ROI) sin caer en fallbacks semilla.

## What gaps exist today
- `InvestmentRepository.getPortfolioSummary` solo ejecutaba un JOIN entre `user_investments` y `properties`. Requiere soportar resolución transparente por email contra la tabla `clients` o fallback inteligente al portafolio del cliente real.
- Falta una suite de pruebas unitarias que valide la resolución y proyección del portafolio desde la tabla `clients`.

## What questions remain open
- Ninguna pregunta abierta; los datos del Excel ya están validados y almacenados en Neon PostgreSQL.
