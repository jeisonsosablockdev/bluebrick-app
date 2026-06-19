# Linear Developer Identity And Documentation Protocol

## VERSION ESPAÑOL

### Propósito
Este protocolo define una política transversal de desarrollo para que la documentación de Linear y los artefactos locales queden atribuidos al desarrollador correcto, vivan en el lugar correcto y se mantengan sincronizados en el workflow del proyecto BRIDS.

### Política de identidad del desarrollador
- Antes de crear, actualizar o sincronizar cualquier contenido en Linear, el agente debe confirmar con qué desarrollador del proyecto está trabajando.
- Si la conversación no confirma explícitamente el desarrollador, el agente debe preguntar: `¿Con qué desarrollador del proyecto estoy trabajando para esta tarea?`
- El campo de ownership en Linear y en los artefactos locales debe registrar el desarrollador confirmado para la tarea.
- Antes de ejecutar los protocolos de inicio de desarrollo, el agente debe confirmar y documentar:
  - quién queda como responsable del issue
  - quién creó el issue
  - a quién está asignado el desarrollo
  - qué identidad de desarrollador quedará asociada a comentarios, actividad de Linear y commits de Git
- Si la integración de Linear publica desde una cuenta técnica distinta al desarrollador confirmado, el agente debe evitar comentarios sueltos para SPECS y dejar el ownership correcto en el cuerpo del issue.

### Política de fuente principal
- Linear es la fuente principal para el issue, sus objetivos, alcance, SPECS y criterios de aceptación.
- Los archivos `.md` del repositorio son el registro Git local y deben mantenerse congruentes con Linear.
- Cuando haya diferencia entre Linear y los `.md`, se debe sincronizar Linear primero y luego actualizar el registro local.
- Esta política debe integrarse en los documentos principales de gobierno, documentación y workflow del proyecto BRIDS.

### Regla de SPECS
- Los SPECS deben quedar en el cuerpo del issue de Linear.
- No se deben guardar SPECS principales como comentarios sueltos del chat de Linear.
- Los documentos o comentarios solo pueden usarse como apoyo si el cuerpo del issue ya contiene la información principal.
- Cuando una rama `Feature` principal se divida en múltiples SPECS, cada SPEC debe tener una rama propia con la nomenclatura `SPEC/<developer>-bri<issue-number>-specNN-<slug>`.
- Ejemplo: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`.
- La numeración `SPEC01`, `SPEC02` y siguientes organiza el scope, pero no impone prioridad obligatoria de ejecución. La estabilidad, las dependencias técnicas y el riesgo de integración pueden cambiar el orden de desarrollo.
- Cada SPEC debe incluir un `Alcance inicial propuesto` para que el desarrollador valide, ajuste o corrija el alcance antes de implementar.

### Regla de SPEC HISTORY
- Al finalizar un SPEC, se debe documentar un bloque `SPEC HISTORY` dentro del marco del Feature y del SPEC desarrollado.
- `SPEC HISTORY` registra lo que salió bien, las decisiones visuales o técnicas que quedaron estables, los patrones reutilizables y la forma en que se llegó a un componente o desarrollo confiable.
- El historial debe distinguir evidencia de validación de aprendizaje estable: no reemplaza criterios de aceptación, pero captura qué patrones deben repetirse en futuros SPECS.
- Cuando el usuario o desarrollador confirme que un ajuste quedó perfecto o estable, ese resultado debe promoverse al `SPEC HISTORY`.
- El bloque debe existir en Linear como fuente principal y en los `.md` locales como registro Git congruente.
- La documentación de `SPEC HISTORY` debe mantener la regla bilingüe: `VERSION ESPAÑOL` primero y `ENGLISH VERSION` después.

### Protocolo SPEC MERGE
- `SPEC MERGE` es el protocolo de finalización de un SPEC antes de integrar su rama `SPEC` a la rama `Feature`.
- Antes de ejecutar `SPEC MERGE`, el agente debe confirmar que el desarrollo del SPEC está terminado y que el desarrollador responsable está confirmado.
- El protocolo debe ejecutar, como mínimo:
  - actualizar `SPEC HISTORY` en el Feature, en el SPEC local y en el documento de implementación correspondiente
  - sincronizar el cuerpo del issue de Linear con la documentación local final
  - ejecutar validaciones razonables para el alcance tocado
  - revisar `git status` y separar cambios ajenos al SPEC
  - integrar la rama `SPEC` hacia la rama `Feature` definida para el issue
  - dejar el Feature listo para el siguiente SPEC
- En este modelo no se crea PR entre ramas `SPEC` y la rama `Feature`, porque el merge ocurre bajo criterio del desarrollador responsable.
- El PR corresponde al cierre de la rama `Feature` hacia la rama base definida por el proyecto, no al cierre interno de cada SPEC.

### Política bilingüe
- La documentación de producto y SPEC debe incluir siempre dos versiones:
  - `VERSION ESPAÑOL`
  - `ENGLISH VERSION`
- La versión en español va primero.
- La versión en inglés va después y debe preservar el mismo significado, alcance y criterios.
- Esta política debe integrarse en los documentos principales de documentación del proyecto BRIDS.

### Política ortográfica del español
- La documentación en español debe escribirse con tildes y signos correctos.
- No se deben omitir tildes en palabras como `documentación`, `política`, `versión`, `desarrollador`, `técnico`, `integración`, `validación`, `módulos`, `categorías`, `inversión`, `página`, `públicas`, `específico`, `aceptación`, `sincronización`, `íconos` y `animación`.
- Los identificadores de código, nombres de ramas, rutas, paquetes y APIs se conservan exactamente como estén definidos.
- Cuando se edite una sección en español, se deben corregir tildes obvias dentro del párrafo tocado.

### Checklist antes de tocar Linear
- [ ] Confirmar desarrollador responsable.
- [ ] Confirmar responsable del issue, creador del issue, asignado al desarrollo e identidad de commits.
- [ ] Confirmar issue destino.
- [ ] Preparar contenido en español e inglés.
- [ ] Revisar tildes y puntuación en la versión en español.
- [ ] Actualizar el cuerpo del issue como fuente principal.
- [ ] Actualizar los `.md` locales para que coincidan con Linear.
- [ ] Al cerrar un SPEC, actualizar `SPEC HISTORY` antes de ejecutar `SPEC MERGE`.
- [ ] Evitar comentarios sueltos salvo que el usuario los pida explícitamente.

## ENGLISH VERSION

### Purpose
This protocol defines a cross-project development policy so Linear documentation and local artifacts are attributed to the correct developer, live in the correct place, and remain synchronized in the BRIDS project workflow.

### Developer Identity Policy
- Before creating, updating, or syncing any Linear content, the agent must confirm which project developer is responsible for the task.
- If the conversation does not explicitly confirm the developer, the agent must ask: `Which project developer am I working with for this task?`
- Ownership fields in Linear and local artifacts must record the confirmed developer for the task.
- Before running development-start protocols, the agent must confirm and document:
  - who is responsible for the issue
  - who created the issue
  - who is assigned to the development work
  - which developer identity will be associated with comments, Linear activity, and Git commits
- If the Linear integration posts from a technical account that differs from the confirmed developer, the agent must avoid loose SPEC comments and make the correct ownership clear in the issue body.

### Primary Source Policy
- Linear is the primary source for the issue, objectives, scope, SPECS, and acceptance criteria.
- Repository `.md` files are the local Git record and must stay consistent with Linear.
- When Linear and local `.md` files diverge, sync Linear first and then update the local record.
- This policy must be integrated into the primary governance, documentation, and workflow documents of the BRIDS project.

### SPEC Rule
- SPECS must live in the Linear issue body.
- Main SPECS must not be stored as loose Linear chat comments.
- Documents or comments may only be used as supporting material if the issue body already contains the primary information.
- When a main `Feature` branch is divided into multiple SPECS, each SPEC must have its own branch using the naming convention `SPEC/<developer>-bri<issue-number>-specNN-<slug>`.
- Example: `SPEC/czambrano-bri168-spec01-landing-dark-hero-look-and-feel`.
- The `SPEC01`, `SPEC02`, and later numbering organizes scope, but it does not impose mandatory execution priority. Stability, technical dependencies, and integration risk may change development order.
- Each SPEC must include a `Proposed Initial Scope` so the developer can validate, adjust, or correct the scope before implementation.

### SPEC HISTORY Rule
- At the end of each SPEC, a `SPEC HISTORY` block must be documented inside the Feature and the SPEC being developed.
- `SPEC HISTORY` records what worked well, which visual or technical decisions became stable, reusable patterns, and how the work reached a reliable component or development state.
- The history must distinguish validation evidence from stable learning: it does not replace acceptance criteria, but it captures which patterns should be repeated in future SPECS.
- When the user or developer confirms that an adjustment is perfect or stable, that result must be promoted into `SPEC HISTORY`.
- The block must live in Linear as the primary source and in local `.md` files as the congruent Git record.
- `SPEC HISTORY` documentation must keep the bilingual rule: `VERSION ESPAÑOL` first and `ENGLISH VERSION` second.

### SPEC MERGE Protocol
- `SPEC MERGE` is the end-of-SPEC protocol before integrating a `SPEC` branch into the `Feature` branch.
- Before running `SPEC MERGE`, the agent must confirm that SPEC development is finished and that the responsible developer is confirmed.
- The protocol must execute, at minimum:
  - update `SPEC HISTORY` in the Feature, local SPEC, and corresponding implementation document
  - sync the Linear issue body with the final local documentation
  - run reasonable validations for the touched scope
  - review `git status` and separate changes unrelated to the SPEC
  - integrate the `SPEC` branch into the issue's defined `Feature` branch
  - leave the Feature ready for the next SPEC
- In this model, no PR is created between `SPEC` branches and the `Feature` branch because the merge happens at the responsible developer's discretion.
- The PR belongs to the closure of the `Feature` branch into the project-defined base branch, not to each internal SPEC closure.

### Bilingual Policy
- Product and SPEC documentation must always include two versions:
  - `VERSION ESPAÑOL`
  - `ENGLISH VERSION`
- The Spanish version comes first.
- The English version comes second and must preserve the same meaning, scope, and criteria.
- This policy must be integrated into the primary documentation documents of the BRIDS project.

### Spanish Orthography Policy
- Spanish documentation must use correct accents and punctuation.
- Do not omit accents in words such as `documentación`, `política`, `versión`, `desarrollador`, `técnico`, `integración`, `validación`, `módulos`, `categorías`, `inversión`, `página`, `públicas`, `específico`, `aceptación`, `sincronización`, `íconos`, and `animación`.
- Code identifiers, branch names, file paths, packages, and APIs must be preserved exactly as defined.
- When editing a Spanish section, fix obvious missing accents in the touched paragraph.

### Checklist Before Touching Linear
- [ ] Confirm responsible developer.
- [ ] Confirm issue owner, issue creator, development assignee, and commit author identity.
- [ ] Confirm target issue.
- [ ] Prepare Spanish and English content.
- [ ] Review accents and punctuation in the Spanish version.
- [ ] Update the issue body as the primary source.
- [ ] Update local `.md` files to match Linear.
- [ ] When closing a SPEC, update `SPEC HISTORY` before running `SPEC MERGE`.
- [ ] Avoid loose comments unless the user explicitly asks for them.
