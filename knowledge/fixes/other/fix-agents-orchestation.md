---
type: Fix Spec
title: Fix Agents Orchestation
description: Fix Agents Orchestation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-agents-orchestation.md
---

# Fix: Agents Orchestation

Last Updated: 2026-06-07 UTC
Status: planned
Owner: shared workflow
Artifact Type: problem

## Summary

Este artefacto documenta el problema.

No define todavía la solución completa ni habilita implementación. Su función es estabilizar:

- qué problema existe
- por qué importa
- qué outcome se espera
- qué gaps hay hoy
- qué preguntas siguen abiertas

La solución formal vive aparte en:

- `docs/fixes/fix-agents-orchestation-implementation.md`

## Problem Statement

Hoy el repositorio ya tiene una arquitectura razonable de gobernanza, pero su ejecución sigue siendo parcialmente blanda.

El problema no es ausencia de policy. El problema es la distancia entre:

- lo que la gobernanza declara
- lo que los agentes creen que deben hacer
- lo que los scripts bloquean de verdad

Ese hueco aparece en varias capas del sistema:

- artefactos
- Linear
- mother branch
- documentation slice
- RFC
- TDD
- PR governance
- responsive QA
- staging y atomicidad de commits

## Why It Matters

Este problema importa porque genera tres tipos de deriva al mismo tiempo:

1. deriva de planeación
- el equipo cree que existe un flujo claro
- pero todavía puede empezar a implementar sin haber estabilizado el problema

2. deriva de ejecución
- el agente conoce la regla
- pero el repo todavía permite saltearla

3. deriva de review
- reviewer y QA comparan contra intención o memoria
- no contra un contrato verdaderamente enforceable

Si esto no se corrige, el sistema sigue dependiendo demasiado de juicio manual, disciplina individual y buena voluntad.

## Expected Outcome

El outcome esperado de esta iniciativa es que el workflow deje de ser mayormente aspiracional y pase a ser operacionalmente verificable.

Eso significa:

- todo trabajo relevante nace en Linear
- la mother branch se toma desde el `git branch name` del issue madre
- el artefacto existe antes de implementación
- el documentation slice ocurre antes de slices de código
- cuando aplica RFC, el RFC vive en ese slice documental
- TDD deja de ser “después vemos”
- PR, QA y reviewer bloquean con base en reglas ejecutables

## Current Gaps

Los gaps actuales más importantes son estos:

1. Los artefactos existen, pero todavía no gobiernan el trabajo.
2. `docs/fixes/*.md` no está enforced al mismo nivel que `docs/features/*.md`.
3. Linear participa, pero no controla formalmente la identidad de la iniciativa.
4. La mother branch todavía puede desviarse de la rama canónica de Linear.
5. El documentation slice no está suficientemente obligado como primer slice.
6. Los RFCs tienen forma, pero no ownership operacional fuerte dentro del documentation slice.
7. TDD todavía no es un gate real del repositorio.
8. PR governance sigue teniendo áreas placeholder o semienforced.
9. QA responsive/browser-critical sigue dependiendo demasiado del juicio manual.
10. Commits y staging siguen permitiendo caminos que rompen atomicidad y gitflow.
11. `AGENTS.md` y `.codex/*` resumen bien la intención, pero todavía no obligan con suficiente precisión:
   - artifact pair para features y fixes
   - documentation slice first
   - Linear-first
   - structured handoffs entre agentes
   - excepciones explícitas para trabajo trivial
12. El sistema todavía depende demasiado de handoffs narrativos y poco de contratos estructurados entre `planner`, `docs`, `qa` y `reviewer`.
13. No existe todavía un set mínimo de evals del propio workflow de desarrollo; sigue habiendo demasiado espacio para “parece que sí” en vez de “el sistema lo demostró”.
14. Al encadenar agentes o slices, todavía existe riesgo de `following the letter, but not the spirit`:
   - el agente pasa el checklist
   - pero no resuelve el outcome real
   - o improvisa cuando falta una decisión material
15. El sistema todavía no define con suficiente claridad cuándo debe detenerse y preguntar, en vez de completar con suposiciones silenciosas.
16. La calidad clean-code todavía podía quedar como auditoría tardía de `reviewer`, en vez de entrar al diseño de cada delivery slice antes de implementar.

## Root Cause Pattern

La mayoría de las fallas comparten la misma raíz:

- la regla vive en docs
- el agente la conoce
- pero el sistema no la convierte en bloqueo real

Ese patrón se repite en:

- artefactos
- Linear
- mother branch
- documentation slice
- RFC
- TDD
- PR governance
- responsive QA
- handoffs entre agentes
- criterios de excepción
- evaluación del propio workflow
- cumplimiento literalista
- improvisación frente a gaps materiales

En corto:

- el sistema ya sabe qué quiere
- pero todavía no bloquea lo incorrecto con suficiente consistencia

## Open Questions

Estas preguntas deben resolverse antes de considerar la solución como decision-complete:

1. ¿Qué tipos de cambios quedan explícitamente exentos del requisito de issue en Linear?
2. ¿Qué heurística exacta deja de permitirse para mother branch y qué verificación determinista sí se adoptará?
3. ¿Qué criterios separan “cambio trivial” de “iniciativa con mother branch + slices”?
4. ¿Qué cambios requieren TDD obligatorio y cuáles solo test coverage mínima?
5. ¿Qué evidencia mínima cuenta como browser-critical artifact suficiente?
6. ¿Qué reglas de responsive QA deben ser automáticas y cuáles seguirán siendo juicio humano?
7. ¿Qué excepciones explícitas permitimos para cambios realmente triviales sin reabrir ambigüedad?
8. ¿Qué handoff mínimo debe ser estructurado para que `planner`, `docs`, `qa` y `reviewer` no trabajen con contexto blando?
9. ¿Qué condiciones deben obligar al sistema a detenerse y preguntar en vez de improvisar?
10. ¿Cómo distinguimos “cumplió el checklist” de “cumplió el outcome real” en review y QA?

## Success Signal

Este problema se considerará correctamente entendido cuando ya no tengamos que discutir:

- de dónde nace una iniciativa
- cuál rama manda
- qué documento gobierna el trabajo
- cuándo se puede empezar a implementar

Si esas respuestas siguen abiertas, todavía estamos en fase de problema y no de solución.

También se considerará insuficientemente entendido si el sistema todavía permite:

- cumplir la letra pero no el espíritu
- cerrar slices con workarounds cosméticos
- avanzar sin preguntar cuando falta una decisión material

## Notes

- Este artefacto no debe usarse como documento de implementación.
- Si una decisión material falta, no se implementa todavía.
- Primero se documenta la pregunta, se resuelve y luego se pasa al artefacto de solución.
