---
type: Fix Spec
title: Fix Public Seo Core Web Vitals And Vercel Performance Hardening BRI- 158
description: Fix Public Seo Core Web Vitals And Vercel Performance Hardening BRI- 158 - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158.md
---

# Fix: BRI-158 Public SEO + Core Web Vitals + Vercel Performance

Last Updated: 2026-05-19 UTC
Status: completed
Owner: frontend platform
Artifact Type: problem

## Summary

Este artefacto define el problema operativo y técnico de performance/SEO en la superficie pública de BRIDS.

No habilita implementación por sí solo. Su función es estabilizar:

- qué problema existe hoy
- por qué importa
- qué outcome esperamos
- qué gaps concretos hay
- qué preguntas deben quedar cerradas antes de tocar código

La solución formal vive en:

- `docs/fixes/fix-public-seo-core-web-vitals-and-vercel-performance-hardening-bri-158-implementation.md`

## Resolution Summary

El problema quedó resuelto en esta rama con estos outcomes verificables:

- recuperación de estático/ISR para la mayoría de rutas públicas de discovery
- eliminación del splash global bloqueante
- retiro del runtime global de wallet del shell raíz
- diferimiento de bootstrap público de auth a intención de uso
- caché compartida para endpoints públicos de properties
- integración de Vercel Speed Insights
- sistema base de imágenes sociales (`opengraph-image` y `twitter-image`)

Follow-up posterior de hardening:

- eliminación de warnings de hidratación en formularios públicos durante QA dev
- eliminación de warnings de sizing en charts del marketplace
- eliminación del warning de aspect-ratio del mark SVG en el wallet header

## Problem Statement

La capa pública de BRIDS tiene una base razonable de SEO técnico:

- metadata centralizada
- canonical URLs
- sitemap
- robots
- JSON-LD
- endpoints machine-readable

Pero la estrategia de carga inicial y performance real en producción no está alineada con lo que Vercel y Next.js permiten optimizar.

El problema no es “falta de SEO”.

El problema es que hoy conviven tres tensiones:

1. rutas públicas con vocación de marketing/discovery
2. dependencias globales de auth, wallet y PWA
3. decisiones de rendering que empujan demasiadas páginas al modo dinámico

Eso hace que el sitio público cargue con más costo de servidor y más JavaScript del necesario para el primer render.

## Why It Matters

Este problema importa por cuatro razones:

1. Descubrimiento orgánico
- si la carga inicial es lenta o inestable, la experiencia de entrada empeora para usuarios que llegan desde búsqueda, referencias o links sociales

2. Core Web Vitals
- LCP, INP y CLS se ven afectados por:
  - shell global con demasiada hidratación
  - overlays/splash en el primer paint
  - componentes cliente en rutas de contenido principalmente estático

3. TTFB y caché en Vercel
- si la mayoría de las rutas públicas caen en render dinámico sin necesidad fuerte, perdemos una parte importante de la ventaja del edge/CDN y del Full Route Cache

4. Gobernanza técnica
- hoy no existe todavía una estrategia documentada y medible para:
  - qué rutas públicas deben ser estáticas
  - cuáles pueden usar ISR
  - cuáles deben seguir dinámicas
  - qué budgets mínimos vamos a defender

## Expected Outcome

El outcome esperado de este fix es dejar una estrategia pública de SEO/performance coherente, explícita y verificable.

Eso significa:

- las rutas públicas críticas recuperan una estrategia de rendering/caché adecuada para Vercel
- el shell público deja de cargar dependencias de wallet/auth/PWA antes de necesitarlas
- la carga inicial deja de depender de overlays bloqueantes o fetches cliente evitables
- existe baseline medible para:
  - LCP
  - INP
  - CLS
  - TTFB
- el repositorio deja documentado qué parte del sitio es:
  - static
  - ISR
  - dynamic

## Current Gaps

Los gaps actuales identificados son estos:

1. El layout raíz público usa APIs de request para resolver locale y eso vuelve dinámicas rutas que podrían ser estáticas.
2. Providers de wallet/PWA y runtime cliente se montan globalmente aunque la mayoría de las rutas públicas no los necesitan para el primer render.
3. El sitio público renderiza UI de auth/wallet desde páginas de marketing aunque el usuario todavía no haya expresado intención de autenticarse o conectar wallet.
4. El splash screen de carga participa en la primera experiencia visual y puede retrasar el contenido percibido.
5. El home todavía resuelve parte de su experiencia con fetch cliente que no aporta valor SEO al HTML inicial.
6. No hay una política operativa documentada para decidir static vs ISR vs dynamic por ruta pública.
7. No hay una instrumentación confirmada de Vercel Speed Insights dentro del producto para validar field data por ruta.
8. No existe todavía un baseline acordado de budgets o thresholds operativos para CWV/TTFB.
9. Algunos endpoints públicos de lectura todavía no aprovechan explícitamente `cache-control` apto para Vercel CDN.
10. La estrategia de metadata social existe, pero no está cerrada como sistema consistente de imágenes OG/Twitter por tipo de página pública.

## Scope Of This Fix

Este fix cubre la superficie pública y su infraestructura inmediata de rendering/carga inicial:

- `app/layout.tsx`
- rutas públicas en `app/`
- SSR/client boundaries de marketing/discovery
- providers globales que hoy afectan la carga pública
- endpoints públicos de lectura que alimentan la UX inicial
- observabilidad de CWV y TTFB en Vercel
- documentación de estrategia SEO/performance pública

Este fix no cubre:

- rediseño visual amplio del sitio
- cambios funcionales grandes en admin
- cambios blockchain/on-chain
- refactors de negocio no relacionados con carga inicial pública
- optimización profunda de flujos protegidos salvo que estén contaminando el shell público

## Route Families Affected

Las familias de rutas que este fix considera críticas son:

- `/`
- `/about`
- `/platform`
- `/software`
- `/regulatory`
- `/transparencia`
- `/knowledge`
- `/knowledge/*`
- `/resources/*`
- `/marketplace`
- `/marketplace/[id]`

## Risks If We Do Nothing

Si no corregimos esto, seguimos con estas consecuencias:

1. TTFB peor de lo necesario en páginas públicas.
2. LCP percibido degradado por UI bloqueante y shell sobrehidratado.
3. INP innecesariamente tensionado por JS global y listeners en rutas de marketing.
4. CLS potencial en banners/overlays/elementos cliente que aparecen después de hidratar.
5. Señal difusa para futuros cambios, porque cada ruta pública puede seguir resolviéndose “como salga”.

## Open Questions

Estas decisiones deben quedar resueltas antes de implementar:

1. ¿La preferencia de locale pública debe resolverse por URL, por build-time default, por cookie, o por una combinación con fallback que no dinamice todo el layout?
2. ¿Qué experiencia de wallet/auth pública debe permanecer visible desde el primer render y cuál puede moverse a carga diferida o intención del usuario?
3. ¿El splash global debe eliminarse por completo, reducirse a rutas puntuales, o mutar a un patrón no bloqueante?
4. ¿Qué rutas públicas quedan formalmente en `static`, cuáles en `ISR` y cuáles en `dynamic`?
5. ¿Qué endpoints públicos anónimos merecen `s-maxage` + `stale-while-revalidate` y cuáles no por frescura/consistencia?
6. ¿Qué budgets operativos adoptaremos como baseline para este repo en móvil?
7. ¿Qué evidencia mínima vamos a exigir para considerar este fix exitoso en Vercel y navegador?

## Success Signal

Consideraremos el problema correctamente resuelto cuando:

- el HTML inicial público recupere mejor cacheabilidad
- el shell público cargue menos JS crítico
- exista una estrategia documentada de rendering por ruta
- tengamos medición real en Vercel de CWV/TTFB
- reviewer pueda verificar el outcome con evidencia, no con intuición

## Notes

- Este documento describe el problema, no la implementación.
- Si una decisión material de rendering/caché sigue abierta, la implementación permanece bloqueada.
