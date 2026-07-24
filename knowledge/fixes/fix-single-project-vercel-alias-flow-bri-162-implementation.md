---
type: Fix Spec
title: Fix Single Project Vercel Alias Flow BRI- 162 Implementation
description: Fix Single Project Vercel Alias Flow BRI- 162 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-single-project-vercel-alias-flow-bri-162-implementation.md
---

# Fix: BRI-162 Single-Project Vercel Alias Flow Implementation

Last Updated: 2026-05-26 UTC
Status: proposed
Owner: platform
Artifact Type: solution

## Summary

Este artefacto define cómo BRIDS debe operar `production`, `qa`, `rc` y previews usando **un solo proyecto Vercel** y varios aliases.

El artefacto de problema asociado vive en:

- `knowledge/fixes/fix-single-project-vercel-alias-flow-bri-162.md`

La implementación permanece bloqueada hasta que este documento siga siendo decision-complete al abrir cada slice técnico.

## Objective

Estabilizar una topología de despliegue simple para BRIDS con estas propiedades:

- un solo proyecto Vercel: `brids`
- production automática desde `main`
- QA estable desde `develop`
- `develop` protegido contra push directo
- CI/CD mínimo coherente entre `develop`, `*-integration` y `main`
- RC promovible desde ramas `release/rc-*`
- previews de PR intactos
- variables no productivas separadas de production sin exigir múltiples proyectos

## Final Topology Decision

La topología objetivo queda cerrada así:

### Project

- proyecto único: `brids`
- `projectId`: `prj_2CgUA7sRLsoazJKP5EQ6zWw0ebma`
- `teamId`: `team_AzWJO6CPd16DRP3TPNt5Ey4c`

### Production

- branch: `main`
- aliases:
  - `brids.io`
  - `www.brids.io`
- mecanismo:
  - Vercel Production Branch nativa
  - deploy automático al mergear o pushear a `main`

### QA

- branch: `develop`
- alias estable:
  - `qa.brids.io`
- mecanismo:
  - Vercel custom preview branch domain sobre `develop`
  - sin workflow adicional para mover alias
- precondición de confianza:
  - `develop` debe estar protegido para aceptar cambios solo vía PR

### Release Candidate

- ramas fuente:
  - `release/rc-*`
- alias estable:
  - `rc.brids.io`
- mecanismo:
  - el push a `release/rc-*` crea preview deployment normal
  - `rc.brids.io` no sigue a todas las ramas release automáticamente
  - `rc.brids.io` se promueve con una automatización controlada que mueve el alias al deployment elegido

### Preview

- ramas:
  - `feature/*`
  - `fix/*`
  - otras ramas no productivas
- dominio:
  - preview URLs nativas de Vercel
- sin alias fijo adicional

## Why This Topology

Esta decisión evita tres problemas:

1. No mezcla production con aliases manuales.
2. No obliga a inventar una rama fija `rc` solo para satisfacer un dominio.
3. No requiere múltiples proyectos para obtener fases estables.

También conserva una diferencia sana entre:

- **QA continua**: `develop` siempre visible en `qa.brids.io`
- **RC promocionado**: solo el candidate explícitamente elegido vive en `rc.brids.io`

Y agrega una condición de integridad:

- **QA gobernada**: `qa.brids.io` solo es válida si `develop` no admite bypass por push directo

## Branch Protection Decision

La protección de `develop` queda dentro del scope de este fix.

Decisión:

- `develop` debe exigir PR para cualquier cambio
- `develop` no debe aceptar push directo de usuarios normales
- el bypass administrativo tampoco debe quedar habilitado por defecto

Configuración objetivo en GitHub:

- `Require a pull request before merging`
- `Require status checks to pass before merging`
- checks requeridos de governance/validate/docs
- `Do not allow bypassing the above settings`
- `Disallow force pushes`
- `Disallow deletions`
- `Restrict who can push to matching branches`

Regla operacional:

- si `develop` puede recibir push directo, `qa.brids.io` no debe considerarse una fase confiable

## CI/CD Governance Decision

El fix también cierra el mínimo viable de gobernanza CI/CD para las ramas que alimentan aliases y releases.

Decisiones:

- el check de governance para PRs a `develop` no debe quedar verde en `opened` sin enforcement real
- `main` debe tener un gate de release más allá de “source branch = develop”
- los PRs a `*-integration` deben ejecutar en CI el preflight canónico que la policy exige

Fuera de alcance explícito:

- agregar Playwright a estos arreglos
- agregar Synpress a estos arreglos
- normalizar en este fix el runtime Node entre CI y Vercel

## Current-State Snapshot

Estado observado al redactar este artefacto:

- `.github/workflows/pr-governance-develop.yml`
  - corre solo en `pull_request` hacia `develop`
  - ejecuta:
    - `Validate (lint + typecheck + docs governance)`
    - `Required Docs Sync Check`
    - `PR Policy (labels, size, branch age, commits, template)`
  - hoy difiere la metadata governance en `opened`

- `.github/workflows/pr-validate-integration-targets.yml`
  - corre solo en `pull_request` hacia `*-integration`
  - ejecuta:
    - `Validate (lint + typecheck + docs governance)`
    - `Required Docs Sync Check`
  - hoy no ejecuta el preflight canónico de policy

- `.github/workflows/enforce-main-source-branch.yml`
  - corre para PRs a `main`
  - solo valida `github.head_ref == develop`
  - hoy no agrega validate/docs/release governance

- `.github/workflows/release-drafter.yml`
  - corre en `push` a `develop`
  - no es un gate de merge; solo actualiza release notes draft

Conclusión técnica:

- `develop` tiene enforcement parcial y con una ventana en `opened`
- `*-integration` no tiene parity con la policy declarada
- `main` no tiene gate de release suficiente
- la API de GitHub para branch protection y rulesets no está disponible para este repo/plan actual, así que la protección remota no puede automatizarse desde este fix

## Target Workflow Matrix

El estado objetivo de workflows y status checks queda así:

### PRs a `develop`

Workflow:

- mantener `.github/workflows/pr-governance-develop.yml`

Status checks requeridos:

- `Validate (lint + typecheck + docs governance)`
- `Required Docs Sync Check`
- `PR Policy (labels, size, branch age, commits, template)`

Regla:

- ninguno de esos checks puede quedar verde en `opened` si el PR todavía incumple metadata o policy

### PRs a `*-integration`

Workflow:

- mantener `.github/workflows/pr-validate-integration-targets.yml`

Status checks requeridos:

- `Validate (lint + typecheck + docs governance)`
- `Required Docs Sync Check`
- `Integration Preflight Policy`

Regla:

- el preflight de integration debe validar el mismo contrato de commit convention, tamaño y branch age que hoy vive en `pr:ready`, sin depender de disciplina local

### PRs a `main`

Workflows:

- mantener `.github/workflows/enforce-main-source-branch.yml`
- agregar `.github/workflows/pr-governance-main.yml`

Status checks requeridos:

- `Enforce Main Source Branch`
- `Release Validate (lint + typecheck + docs governance)`
- `Release Required Docs Sync Check`
- `Release PR Policy`

Regla:

- `main` no puede depender solo del source-branch check

## GitHub Ruleset Specification

La implementación deberá cerrar una especificación explícita de branch protection o ruleset para `develop` y `main`.

### `develop`

Configuración objetivo:

- target: `develop`
- require pull request before merging: `enabled`
- required status checks:
  - `Validate (lint + typecheck + docs governance)`
  - `Required Docs Sync Check`
  - `PR Policy (labels, size, branch age, commits, template)`
- require branches to be up to date before merging: `enabled`
- disallow force pushes: `enabled`
- disallow deletions: `enabled`
- do not allow bypassing the above settings: `enabled`
- restrict who can push to matching branches: `enabled`

Interpretación operativa:

- ningún usuario de trabajo normal puede hacer `git push origin develop`
- el merge a `develop` debe ocurrir a través del botón de PR o merge queue si el repo la usa

Limitación detectada:

- esta configuración debe aplicarse manualmente en la UI de GitHub mientras el repo no tenga acceso a branch protection o rulesets por API

### `main`

Configuración objetivo:

- target: `main`
- require pull request before merging: `enabled`
- required status checks:
  - `Enforce Main Source Branch`
  - `Release Validate (lint + typecheck + docs governance)`
  - `Release Required Docs Sync Check`
  - `Release PR Policy`
- require branches to be up to date before merging: `enabled`
- disallow force pushes: `enabled`
- disallow deletions: `enabled`
- do not allow bypassing the above settings: `enabled`
- restrict who can push to matching branches: `enabled`

Interpretación operativa:

- el único source branch permitido sigue siendo `develop`
- incluso viniendo de `develop`, el PR debe pasar un gate release mínimo

Limitación detectada:

- esta configuración también depende de aplicación manual en la UI de GitHub bajo el plan actual del repo

## Compensating Control For Branch Protection Limitation

Como el repo actual no expone branch protection o rulesets por API, este fix agrega un control compensatorio dentro del repo:

- `.github/workflows/protected-branch-push-provenance.yml`

Objetivo:

- detectar cualquier push a `develop` o `main` cuyo commit final no esté asociado a un PR mergeado hacia esa misma rama

Alcance:

- no bloquea el push antes de entrar
- sí deja evidencia inmediata y un fallo explícito después del push

Interpretación:

- no reemplaza branch protection real
- reduce el tiempo en que un bypass puede pasar desapercibido

## Environment Strategy

La estrategia de variables queda así:

### Production Environment

Se usa exclusivamente para:

- `main`
- `brids.io`
- `www.brids.io`

Reglas:

- nunca reutilizar secretos productivos en `develop` o `release/rc-*`
- cualquier cambio de secretos productivos sigue el flujo normal de producción

### Preview Baseline

El entorno `Preview` será el baseline para toda rama no productiva.

Debe contener:

- secretos seguros de no producción
- URLs y webhooks no productivos
- integraciones compatibles con QA manual y previews

Reglas:

- `Preview` no puede apuntar a DB, colas o webhooks de producción
- los defaults de Preview deben ser seguros incluso para ramas efímeras

### Branch Overrides

Se usarán overrides por rama preview para estos casos:

- `develop`
- `release/rc-*` o la rama release activa que se quiera promover

Decisión:

- `develop` recibe overrides de QA cuando haga falta
- `release/rc-*` puede heredar Preview baseline y solo sobreescribir lo estrictamente necesario

Baseline operativo:

- `develop` y `release/rc-*` pueden compartir el mismo data plane no productivo inicialmente
- si la interferencia operativa resulta material, el aislamiento de RC será follow-up y no bloquea este fix

## GitHub And Vercel Secret Prerequisites

La implementación repo-side de este fix asume estos secretos en GitHub Actions:

- `VERCEL_TOKEN`

No se consideran sensibles y pueden quedar hardcoded en workflow:

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Limitación detectada:

- la sesión local OAuth de Vercel permite deploy/alias desde CLI, pero no permite crear tokens API automáticamente
- por tanto, `VERCEL_TOKEN` debe sembrarse manualmente en GitHub desde un classic personal token de Vercel

## Automation Decision

La automatización queda dividida en dos niveles:

### 1. Native Automation

Sin código adicional:

- `main` -> production
- `develop` -> `qa.brids.io`
- todas las ramas no productivas -> preview deployment

Esto vive en:

- Git Integration de Vercel
- Production Branch
- custom preview branch domain de `develop`

Precondición:

- GitHub branch protection o ruleset sobre `develop`
- workflows de PR con enforcement efectivo, no solo declarativo

### 2. Controlled RC Promotion

Con automatización propia:

- las ramas `release/rc-*` despliegan previews automáticamente
- un workflow de GitHub promueve `rc.brids.io` al deployment release elegido

Decisión clave:

- `rc.brids.io` **no** debe moverse en cada push automáticamente
- debe moverse mediante una promoción explícita y auditable

## Proposed RC Promotion Workflow

La implementación deberá usar un workflow dedicado, por ejemplo:

- `.github/workflows/promote-rc-alias.yml`

Trigger recomendado:

- `workflow_dispatch`

Inputs mínimos:

- `release_branch`
- opcionalmente `deployment_url`

Comportamiento:

1. Resolver la rama `release/rc-*` objetivo.
2. Obtener el preview deployment más reciente de esa rama.
3. Verificar que el deployment esté `READY`.
4. Verificar que el commit SHA coincida con la rama objetivo.
5. Ejecutar:
   - `vercel alias set <deployment-url> rc.brids.io`
6. Emitir summary con:
   - branch
   - commit SHA
   - deployment id/url
   - timestamp

Rollback:

1. seleccionar un deployment RC anterior
2. volver a ejecutar la misma promoción sobre ese deployment

## QA Verification Contract

La aceptación operativa mínima para el flujo será esta:

### QA Alias

Debe demostrarse que:

- `qa.brids.io` resuelve al deployment más reciente de `develop`
- el contenido servido coincide con el commit esperado
- el commit llegó por PR mergeado, no por push directo

### RC Alias

Debe demostrarse que:

- `rc.brids.io` resuelve al deployment promovido
- el deployment corresponde al `release/rc-*` elegido
- el cambio de alias es reversible

### Production

Debe demostrarse que:

- `brids.io` y `www.brids.io` siguen quedando reservados al deployment de `main`
- el PR que promueve a `main` pasó por un gate de release coherente

## Workflow Activation

Este fix activa:

- `.codex/workflows/mainnet-hardening.md`

Participantes esperados para implementación posterior:

- `planner`
- `docs`
- `security`
- `qa`
- `reviewer`

Se agrega `frontend` solo si durante la implementación aparecen cambios de app ligados a env flags, route gating o dominios públicos visibles desde la UI.

## Solution Slices

## Slice 0: Documentation Slice

Objetivo:

- cerrar artifact pair
- fijar topología
- fijar estrategia de variables
- fijar estrategia de promoción RC

Entrega:

- `knowledge/fixes/fix-single-project-vercel-alias-flow-bri-162.md`
- `knowledge/fixes/fix-single-project-vercel-alias-flow-bri-162-implementation.md`
- Linear `BRI-162` sincronizado con esta decisión

## Slice 1: Vercel Topology Baseline

Objetivo:

- dejar el proyecto `brids` con la topología declarada

Incluye:

- confirmar production branch
- confirmar `brids.io` y `www.brids.io`
- agregar y asociar `qa.brids.io` a `develop`
- documentar `rc.brids.io` como alias móvil, no branch domain fijo

No acceptable if:

- `qa.brids.io` queda dependiente de pasos manuales

## Slice 1.5: Develop Protection Hardening

Objetivo:

- cerrar la brecha entre la policy declarada y el enforcement real sobre `develop`

Incluye:

- verificar ruleset o branch protection activa en GitHub
- exigir PR obligatorio sobre `develop`
- exigir checks requeridos
- bloquear bypass operativo no justificado

Diseño técnico:

1. Confirmar si el repo usa branch protection clásica o rulesets.
2. Si no existe una regla efectiva para `develop`, crearla.
3. Si existe pero permite bypass, endurecerla con:
   - `Do not allow bypassing the above settings`
   - `Restrict who can push to matching branches`
4. Declarar como required checks exactamente estos nombres:
   - `Validate (lint + typecheck + docs governance)`
   - `Required Docs Sync Check`
   - `PR Policy (labels, size, branch age, commits, template)`
5. Verificar manualmente con un intento controlado de push:
   - esperado: rechazo remoto
6. Mientras la regla remota no pueda gestionarse por API, mantener activo el compensating control:
   - `.github/workflows/protected-branch-push-provenance.yml`

Archivos potencialmente tocados:

- ninguno dentro del repo si el cambio vive solo en GitHub settings
- documentación del fix para capturar evidencia y screenshots de la regla
- `.github/workflows/protected-branch-push-provenance.yml` como compensating control temporal

Evidencia requerida:

- captura o export de la regla activa
- rechazo remoto confirmado para push directo a `develop`
- PR normal a `develop` todavía mergeable cuando pasa checks

Fallback aceptable mientras no exista branch protection programable:

- workflow de provenance fallando si alguien hace push directo o bypass

No acceptable if:

- sigue siendo posible `git push origin develop` para trabajo normal

## Slice 1.6: Develop Governance Check Hardening

Objetivo:

- eliminar la ventana donde el check de governance puede aparecer exitoso en `opened` sin validar metadata real

Incluye:

- ajustar el workflow de PR a `develop`
- asegurar que el status requerido falle o quede pendiente hasta tener metadata válida

Decisión técnica cerrada:

- no se aceptará el modelo actual de “green but deferred on opened”
- el job `PR Policy (labels, size, branch age, commits, template)` debe evaluar desde `opened`

Cambios concretos esperados:

### Workflow

Archivo:

- `.github/workflows/pr-governance-develop.yml`

Cambios:

1. eliminar el step:
   - `Defer metadata enforcement on opened`
2. ejecutar el script de policy en `opened`, `edited`, `synchronize`, `reopened`, `ready_for_review`
3. mantener el mismo nombre de job para no romper required-check mapping

### Policy behavior

El job debe fallar inmediatamente si faltan:

- un `scope:*`
- un `type:*`
- un `risk:*`
- secciones `issue`, `rfc`, `riesgos`, `rollback plan`, `prueba devnet`
- commit convention válida
- compliance de size / feature-flag
- compliance de branch age

### Why this design

La protección de rama no distingue intención; solo ve status checks.

Si el check requerido queda `success` en `opened`, GitHub puede considerar el PR mergeable demasiado temprano. Por eso la validación debe correr de verdad desde el primer evento.

Evidencia requerida:

- abrir PR deliberadamente sin labels/body y observar fallo inmediato del job
- corregir metadata y observar recuperación a verde

No acceptable if:

- un PR puede quedar mergeable tras `opened` sin labels/body requeridos

## Slice 1.7: Main Release Gate Hardening

Objetivo:

- llevar `main` a un gate mínimo coherente con la policy de release

Incluye:

- mantener el check `develop -> main`
- añadir validación y gobernanza release para PRs a `main`

Decisión técnica cerrada:

- `main` no reutiliza el mismo policy gate de `develop` sin adaptación
- el PR `develop -> main` es un artefacto de release, no un PR de slice normal

### Workflow design

Archivo nuevo esperado:

- `.github/workflows/pr-governance-main.yml`

Triggers:

- `pull_request` a `main`
- tipos:
  - `opened`
  - `edited`
  - `synchronize`
  - `reopened`
  - `ready_for_review`

Jobs esperados:

1. `Release Validate (lint + typecheck + docs governance)`
2. `Release Required Docs Sync Check`
3. `Release PR Policy`

### Release PR Policy scope

La policy de release debe ser propia y más estrecha que la de `develop`.

Razón:

- `develop` es long-lived
- la edad de rama y el tamaño acumulado de `develop` no son señales útiles para bloquear una promoción release

Por tanto, `Release PR Policy` debe validar:

- source branch exacta `develop`
- presencia de body sections:
  - `issue`
  - `rfc`
  - `riesgos`
  - `rollback plan`
  - `prueba devnet`
- que `prueba devnet` no quede vacía
- que el PR indique explícitamente si el release candidate fue validado o si algo aplica como `not applicable`

No debe validar en este fix:

- branch age de `develop`
- size threshold de líneas añadidas en el diff release
- labels de slice como si fuera PR de feature/fix individual

### Implementation shape

Se prefiere crear un script dedicado, por ejemplo:

- `scripts/ci/release-pr-lint.sh`

Responsabilidades:

- leer el body del PR vía API o `github-script`
- verificar secciones obligatorias
- fallar si `github.head_ref != develop`

Relación con workflow existente:

- `.github/workflows/enforce-main-source-branch.yml` puede mantenerse como guard simple
- `pr-governance-main.yml` añade validate/docs/release policy

Evidencia requerida:

- PR de prueba `develop -> main` con body incompleto falla
- PR de prueba `feature/* -> main` falla por source branch
- PR de release correcto pasa todos los checks

No acceptable if:

- `main` sigue dependiendo solo del workflow de source branch

## Slice 1.8: Integration Preflight Enforcement

Objetivo:

- alinear CI con la policy que exige preflight para PRs a `*-integration`

Incluye:

- ejecutar el preflight canónico en CI para integration PRs
- fallar si el branch viola commit convention, tamaño o edad según la policy

Restricción técnica observada:

- `scripts/ci/pr-ready.sh` hoy falla en checkout detached porque exige `git branch --show-current`

Decisión técnica cerrada:

- no se llamará `pr:ready` en CI sin antes hacerlo CI-safe

### Implementation options considered

#### Opción descartada

- llamar `npm run pr:ready -- --base "$BASE_REF"` tal como está

Motivo de descarte:

- en GitHub Actions el checkout del PR suele quedar detached
- `pr-ready.sh` aborta si no puede detectar `CURRENT_BRANCH`

#### Opción elegida

- extraer o adaptar la parte reusable de policy a un modo CI-safe

Implementación preferida:

1. extender `scripts/ci/pr-ready.sh` con:
   - `--head-branch <name>` opcional
   - o variable `HEAD_BRANCH_OVERRIDE`
2. cuando esté presente, usar ese nombre en vez de depender de `git branch --show-current`
3. permitir ejecución sobre `HEAD` detached mientras:
   - exista `origin/<base>`
   - el diff `merge-base..HEAD` sea resoluble

### Workflow design

Archivo:

- `.github/workflows/pr-validate-integration-targets.yml`

Job nuevo esperado:

- `Integration Preflight Policy`

Comando recomendado:

```bash
npm run pr:ready -- --base "${BASE_REF}" --validate-mode governance-only --head-branch "${HEAD_BRANCH}"
```

Variables:

- `BASE_REF=${{ github.base_ref }}`
- `HEAD_BRANCH=${{ github.head_ref }}`

Qué valida ese job:

- docs governance mínima
- commit convention del branch
- size discipline
- branch age discipline

Qué no debe duplicar:

- `npm run validate` completo, porque ya corre en el job `Validate`

Evidencia requerida:

- PR a `*-integration` con commit inválido falla
- PR a `*-integration` demasiado grande falla salvo excepción documentada
- PR a `*-integration` demasiado vieja falla salvo excepción documentada

No acceptable if:

- el preflight obligatorio sigue siendo solo una recomendación local

## Slice 2: Preview Variable Policy

Objetivo:

- cerrar el baseline de variables para Preview y sus overrides

Incluye:

- inventario de variables sensibles
- separación `Production` vs `Preview`
- overrides documentados para `develop`
- overrides mínimos para `release/rc-*`

No acceptable if:

- Preview sigue pudiendo tocar recursos de producción

## Slice 3: RC Promotion Automation

Objetivo:

- automatizar la promoción controlada de `rc.brids.io`

Incluye:

- workflow GitHub
- resolución del deployment correcto
- alias promotion
- resumen auditable del resultado

No acceptable if:

- `rc.brids.io` puede quedar movido por una rama equivocada o sin evidencia

## Slice 4: Rollback And Evidence

Objetivo:

- hacer repetible la reversión y la verificación

Incluye:

- procedimiento de rollback
- comando o workflow de re-promoción
- evidencia mínima en summary o run output

No acceptable if:

- revertir `rc.brids.io` depende de memoria tácita

## Tests First Contract

Antes de implementar slices técnicas, debemos empezar por checks del flujo:

1. Validación de inputs del workflow de promoción RC.
2. Pruebas del helper o script que resuelve el deployment correcto por rama.
3. Dry-run seguro del comando de aliasing contra un preview deployment.
4. Verificación de protección efectiva de `develop` en GitHub.
5. Verificación de enforcement real en:
   - PRs a `develop`
   - PRs a `main`
   - PRs a `*-integration`
6. Verificación final por `vercel inspect` y resolución de dominio para:
   - `qa.brids.io`
   - `rc.brids.io`
   - `brids.io`

Fixtures o casos de prueba administrativos mínimos:

1. PR a `develop` abierto sin labels ni body completo:
   - esperado: `PR Policy...` falla en `opened`
2. intento de push directo a `develop`:
   - esperado: rechazo remoto por branch protection
3. PR a `main` desde branch distinta de `develop`:
   - esperado: falla `Enforce Main Source Branch`
4. PR a `main` desde `develop` con body incompleto:
   - esperado: falla `Release PR Policy`
5. PR a `*-integration` con commit subject inválido:
   - esperado: falla `Integration Preflight Policy`
6. promoción RC con deployment no `READY`:
   - esperado: workflow de RC promotion falla antes de mover alias

La evidencia final debe incluir:

- branch
- commit SHA
- deployment id/url
- alias resultante

## Branching Model

Mother branch esperada para la implementación posterior:

- `fix/single-project-vercel-alias-flow-bri-162`

Slices hijas solo si aparece write scope separado entre:

- documentación
- settings/scripts/workflows
- QA evidence

## Commit Policy

Patrón canónico esperado:

- `docs(docs): ...`
- `fix(shared): ...`
- `ci(shared): ...`
- `test(shared): ...`

Preferencia:

1. commit documental inicial
2. commit de topología/configuración
3. commit de workflow de promoción RC
4. commit de QA/evidence docs si aplica

## Pull Request Strategy

PR a `develop`, con secciones obligatorias:

- `issue`
- `rfc`
- `riesgos`
- `rollback plan`
- `prueba devnet`

Reglas de metadata:

- `issue`: `BRI-162`
- `rfc`: `not applicable` salvo que el scope crezca a una re-arquitectura mayor
- `prueba devnet`: `not applicable` porque este fix no es blockchain

## Linear Sync

Linear debe reflejar este artefacto, no al revés.

Sincronización mínima requerida:

1. issue `BRI-162` con título y descripción alineados al problema
2. referencia explícita a este artifact pair
3. actualización posterior con:
   - branch mother
   - slices abiertas
   - evidencia de promoción QA/RC cuando exista
   - evidencia de hardening CI/CD de `develop`, `main` y `*-integration`

## Blocking Gates Before Implementation

La implementación permanece bloqueada si falta cualquiera de estas decisiones:

1. `qa.brids.io` no está fijado a `develop`
2. `rc.brids.io` no está definido como alias móvil promovido
3. `develop` sigue aceptando push directo para flujo normal
4. el workflow de governance a `develop` sigue pudiendo pasar en `opened` sin validar metadata real
5. `main` sigue sin gate mínimo de release validation/governance
6. los PRs a `*-integration` siguen sin preflight obligatorio en CI
7. no existe estrategia explícita de variables Preview vs Production
8. no existe estrategia de rollback para RC
9. no existe evidencia mínima acordada para verificar alias y commit
