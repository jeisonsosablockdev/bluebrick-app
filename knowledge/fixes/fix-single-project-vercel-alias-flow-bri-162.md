# Fix: BRI-162 Single-Project Vercel Alias Flow

Last Updated: 2026-05-26 UTC
Status: proposed
Owner: platform
Artifact Type: problem

## Summary

Este artefacto define el problema operativo de despliegue para BRIDS en Vercel bajo una estrategia de **un solo proyecto y varios aliases**.

No habilita implementación por sí solo. Su función es cerrar:

- qué problema existe hoy
- por qué importa
- qué outcome esperamos
- qué gaps concretos hay
- qué decisiones deben quedar resueltas antes de tocar configuración o automatización

La solución formal vive en:

- `knowledge/fixes/fix-single-project-vercel-alias-flow-bri-162-implementation.md`

Linear source of truth:

- `BRI-162` - `Single-project Vercel alias flow for production, QA, and RC`

## Problem Statement

BRIDS ya tiene un proyecto canónico en Vercel:

- proyecto: `brids`
- production domains activos:
  - `brids.io`
  - `www.brids.io`

La parte que falta no es “tener dominio”.

La parte que falta es una **convención operacional completa** para manejar en ese mismo proyecto:

- `production`
- `qa`
- `rc`
- previews efímeros de PR
- protección real de la rama que alimenta `qa`
- gobernanza CI/CD consistente entre `develop`, `main` y release promotion

Hoy existen piezas sueltas:

- el dominio de production ya resuelve
- Vercel crea previews por rama
- `develop` puede convivir como preview branch
- un release candidate puede desplegarse manualmente

Pero todavía no existe una política cerrada para responder sin ambigüedad:

1. qué alias sigue a `main`
2. qué alias sigue a `develop`
3. cómo se promueve un `release/rc-*`
4. qué parte es automática por Git Integration
5. qué parte necesita automatización propia
6. qué variables usa cada fase
7. cómo se evita que `rc.brids.io` o `brids.io` apunten al deployment equivocado
8. cómo se evita que `qa.brids.io` publique cambios que entraron por push directo a `develop`
9. cómo se evita que un PR quede mergeable con governance incompleta al abrirse
10. cómo se evita que `main` reciba una promoción con checks incompletos

## Why It Matters

Este problema importa por cinco razones:

1. Release safety
- si `production` y `rc` no tienen reglas claras, es fácil publicar el deployment incorrecto

2. QA validity
- si `qa` no tiene branch/domain/variables estables, el equipo no valida siempre sobre el mismo contrato operativo

2.1. QA source integrity
- si `develop` acepta push directo, `qa.brids.io` deja de representar una rama gobernada por PR y revisión

3. Secret and environment drift
- con un solo proyecto, `preview` comparte superficie y hay que decidir explícitamente cómo se separan `qa` y `rc`

4. Rollback clarity
- si no existe una estrategia de alias promotion y rollback, la reversión depende de memoria operativa

5. Governance
- el repo ya exige artifact-first para fixes no triviales y este flujo afecta release hardening, QA y deployment governance

6. CI/CD trust
- si `develop`, `main` y release promotion no comparten un gate mínimo coherente, un alias correcto puede igual apuntar a un estado mal gobernado

## Expected Outcome

El outcome esperado de este fix es dejar a BRIDS con una topología de despliegue simple, repetible y documentada:

- un solo proyecto Vercel: `brids`
- `main` controla production
- `develop` controla `qa.brids.io`
- `release/rc-*` genera previews automáticos y puede promover `rc.brids.io` con una automatización explícita
- los previews de PR siguen existiendo sin dominio fijo
- las variables y los gates operativos quedan definidos por fase
- `develop` queda protegido para que `qa.brids.io` solo reciba cambios vía rama + PR
- `main` y las promociones RC quedan sujetas a checks de gobernanza y validación consistentes

## Current Gaps

Los gaps actuales identificados son estos:

1. `brids.io` y `www.brids.io` están resueltos, pero la política completa de branch-to-alias no está documentada.
2. `qa.brids.io` no tiene todavía una convención confirmada y persistente atada a `develop`.
3. `rc.brids.io` no tiene una estrategia operativa cerrada para ramas `release/rc-*`.
4. No existe una definición canónica de qué se apoya en Vercel branch domains y qué se apoya en `vercel alias`.
5. No existe una estrategia documentada de variables para:
   - production
   - preview baseline
   - overrides de `develop`
   - overrides de `release/rc-*`
6. No existe una automatización documentada para promover o revertir `rc.brids.io`.
7. No existe una política explícita sobre cuándo `rc` se mueve automáticamente y cuándo requiere una acción de promoción controlada.
8. No existe un contrato operativo de evidencia mínima para validar que `qa` y `rc` apuntan al commit correcto.
9. La gobernanza declarada del repo prohíbe push directo a `develop`, pero el enforcement efectivo vive hoy en checks de PR y scripts locales, no en una protección remota garantizada.
10. Mientras `develop` siga aceptando push directo, `qa.brids.io` puede publicar cambios no trazados por PR.
11. El workflow de governance para PRs a `develop` difiere la validación de metadata en `opened`, dejando una ventana donde el status puede aparecer verde sin enforcement material.
12. Los PRs a `main` solo tienen hoy un control de source branch, no un gate equivalente de validación/gobernanza release.
13. Los PRs hacia ramas `*-integration` no ejecutan en CI el preflight canónico que la policy declara como obligatorio.

## Scope Of This Fix

Este fix cubre:

- topología de dominios y aliases en Vercel para un solo proyecto
- branch tracking y branch domains
- protección efectiva de `develop` como source branch de QA
- endurecimiento mínimo de los gates CI/CD que gobiernan `develop`, `*-integration` y `main`
- estrategia de variables por entorno/rama
- automatización de promoción para `rc.brids.io`
- rollback operativo para aliases no productivos
- documentación de release flow y QA flow

Este fix no cubre:

- rediseño de la aplicación
- cambios funcionales de negocio
- cambios on-chain
- separación a múltiples proyectos Vercel
- migración inmediata a Custom Environments dependientes de plan
- expansión del scope a browser E2E gates adicionales
- normalización de runtime/toolchain entre CI y Vercel

## Risks If We Do Nothing

Si no corregimos esto, seguimos con estas consecuencias:

1. `qa` puede seguir siendo una convención informal en vez de una fase estable.
2. `rc` puede depender de pasos manuales ambiguos o repetidos de memoria.
3. production puede terminar recibiendo un deploy no verificado por una confusión de aliases.
4. rollback puede ser más lento de lo necesario.
5. la gobernanza de release queda débil porque la topología real vive en decisiones orales, no en artefactos.
6. `qa.brids.io` puede servir cambios que nunca pasaron por PR porque `develop` sigue abierto a push directo.
7. `main` puede seguir promoviendo cambios con menos controles que los que exige la policy.
8. un PR puede verse “apto” demasiado pronto por un status check de governance diferido en `opened`.

## Open Questions

Estas decisiones deben quedar resueltas antes de implementar:

1. ¿`qa.brids.io` debe seguir siempre a `develop` por branch domain nativo?  
   Resolución objetivo del fix: sí.

2. ¿`rc.brids.io` debe seguir una rama fija o un alias móvil promovido desde `release/rc-*`?  
   Resolución objetivo del fix: alias móvil promovido.

3. ¿La promoción de `rc.brids.io` debe ocurrir automáticamente en cada push de release?  
   Resolución objetivo del fix: no; debe ser una promoción controlada con workflow explícito.

4. ¿El diseño debe depender de Vercel Custom Environments?  
   Resolución objetivo del fix: no; el baseline debe funcionar con Preview + branch-specific overrides.

5. ¿`develop` y `release/rc-*` pueden compartir el mismo data plane no productivo al inicio?  
   Resolución objetivo del fix: sí, con prohibición explícita de usar producción y con opción futura de aislar RC si el ruido operativo lo exige.

6. ¿La protección de `develop` debe considerarse parte del mismo fix?  
   Resolución objetivo del fix: sí, porque sin ese control `qa.brids.io` no es una fase confiable.

7. ¿El fix debe incluir endurecimiento de Playwright o Synpress?  
   Resolución objetivo del fix: no; ese trabajo queda fuera de este alcance.

8. ¿El fix debe incluir normalización de Node 24 entre CI y Vercel?  
   Resolución objetivo del fix: no; ese drift queda fuera de este alcance.

## Success Signal

Consideraremos el problema correctamente resuelto cuando:

- la relación branch -> alias -> variables quede documentada sin ambigüedad
- `qa.brids.io` tenga una fase estable asociada a `develop`
- `develop` no acepte push directo fuera del flujo rama + PR
- `rc.brids.io` tenga una promoción controlada y reversible
- production permanezca reservada a `main`
- los PRs a `main` tengan un gate mínimo coherente con release promotion
- los checks de governance no puedan verse en verde antes de aplicar la validación real
- reviewer pueda verificar el flujo completo con evidencia operativa y no con memoria del equipo

## Notes

- Este documento describe el problema, no la implementación.
- Si alguna decisión material de la topología o de la automatización sigue abierta, la implementación permanece bloqueada.
