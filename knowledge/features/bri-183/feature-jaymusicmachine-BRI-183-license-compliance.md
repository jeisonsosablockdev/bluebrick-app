# Problem Artifact: license-compliance (Verificación de Licencias & Gobernanza de Software)

## What problem exists
El repositorio actual carece de una herramienta automatizada para auditar y verificar las licencias de código abierto de las dependencias instaladas (directas y transitivas). Esto expone al proyecto al riesgo legal de incorporar librerías con licencias Copyleft restrictivas (tales como GPL-2.0, GPL-3.0, AGPL-3.0, SSPL-1.0), lo cual impediría licenciar el producto como software propietario comercial.

## Why it matters
Asegurar el cumplimiento legal de licencias (License Compliance) es un requisito crítico de gobernanza e infraestructura antes de cualquier lanzamiento comercial o auditoría con inversionistas. Si se llega a incluir una librería con Copyleft Fuerte, toda la base de código podría quedar sujeta a exigencias de liberación de código fuente.

## What outcome is expected
1. Disponer del comando `pnpm check:licenses` en `package.json` respaldado por la política de licencias `knowledge/governance/license-policy.json`, el cual bloquee el build (`exit code 1`) ante dependencias no autorizadas.
2. Disponer del comando `pnpm knowledge:licenses` para generar y actualizar el informe de cumplimiento `knowledge/governance/licenses-report.md`.
3. Integrar la verificación de licencias en la cadena de comandos `pnpm validate` y en las reglas de auditoría del agente `architect`.

## What gaps exist today
- No existe un mecanismo nativo en la suite de validación `pnpm validate` que verifique licencias.
- No existe un reporte centralizado en `/knowledge/governance/` que desglose los paquetes instalados y sus licencias SPDX.
- No hay política formal en JSON que defina licencias permisivas aprobadas vs. licencias Copyleft prohibidas.

## What questions remain open
- Ninguna. Todas las decisiones de arquitectura, motor de evaluación (script nativo TypeScript con `pnpm licenses list --json`), política moderada (Copyleft Fuerte prohibido, Copyleft Débil con advertencia) e informes fueron resueltas vía `/grill-me`.
