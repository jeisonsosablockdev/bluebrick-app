---
type: Reference
title: Linear Context Chat
description: Chat log of Linear integration capabilities and project discovery sessions
tags: [architecture, linear, integration, planning, discovery, project-management]
timestamp: 2026-06-16T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/linear-context.md
---

## LINEAR CONTEXT CHAT

dime que tanto puedes hacer con linear


Con Linear puedo ayudarte bastante, directamente desde aquí:

Buscar y listar issues, proyectos, ciclos, equipos y labels.
Crear issues nuevas con título, descripción, prioridad, asignación y estado.
Actualizar issues existentes (estado, responsable, fechas, prioridad, labels, etc.).
Comentar en issues y mantener seguimiento de avances.
Hacer triage: agrupar, priorizar y proponer plan de ejecución.
Conectar trabajo técnico con tickets (resumir cambios, checklist, próximos pasos).
Límites reales:

Solo puedo hacer lo que tu workspace/permisos de Linear permitan.
No puedo saltarme permisos de organización.
Si algo requiere aprobación o acceso no concedido, te lo digo y seguimos con alternativa.
Si quieres, te muestro ahora mismo qué tickets tienes abiertos y te propongo prioridad.


Quiero que uses tu skill de linear para que documentes el proyecto y las cosas que hemos hecho, usa los epics como projects. que tenga la fecha en la que fue creado y toda la documentacion que hemos hecho



8 previous messages
Listo. Ya usé Linear y dejé el proyecto documentado como pediste: epics como projects, con fecha de creación y documentación cargada en cada uno.

Projects creados en Linear

EPIC-001 Admin Asset Create Form (creado en git: 2026-03-13)
EPIC-002 Core Candy Machine Mint Module (creado en git: 2026-03-19)
EPIC-003 NFT Store Purchase Flow (creado en git: 2026-03-24)
EPIC-004 User Profile KYC AML (creado en git: 2026-03-25)
EPIC-006 Deploy Freeze Delegate Inheritance (creado en git: 2026-03-29)
EPIC-007 Offline Recovery Protocol (creado en git: 2026-03-29)
Documentos creados dentro de cada project (inventario)

Inventario documental · EPIC-001
Inventario documental · EPIC-002
Inventario documental · EPIC-003
Inventario documental · EPIC-004
Inventario documental · EPIC-006
Inventario documental · EPIC-007
Incluí en cada documento:

Fecha de creación del epic (tomada de git).
Resumen de lo implementado.
Documentación global creada.
RFCs y archivos de documentación del epic.
Si quieres, siguiente paso te lo dejo automático: crear issues “Documentation Sync” por cada project para que futuras actualizaciones de docs queden trazables por sprint.


Lo que hacemos aca impacta en algo mi proyecto que estoy desarrollando o ya que no hacemos codigo en el proyecto queda por fuera?


Impacta en tu proyecto de gestión, no en tu código.

Sí impacta: creé proyectos y documentos en Linear (organización/seguimiento).
No impacta: no modifiqué archivos del repo, no hice commits, no toqué tu app ni tus programas Solana.
En resumen: quedó todo “por fuera” del código, pero sí quedó registrado en Linear.


OK tengo unas ideas de cosas que deseo hacer pero son cosas de planificacion, nada de desarrollo concretado aun, como tomo ventaja de los recursos de linear para ello


Aprovecha Linear como “sistema operativo” de planificación antes de escribir código:

Crea un Project por iniciativa grande (en tu caso, épics como projects).
Dentro de cada project, crea Issues de descubrimiento:
problema
hipótesis
alcance/no alcance
riesgos
dependencias
criterio de éxito
Usa una plantilla fija por issue de planificación:
Contexto
Objetivo
Opciones (A/B/C)
Tradeoffs
Decisión propuesta
Riesgos
Próximo paso
Define labels para ordenar rápido:
planning
research
rfc
blocked
security
frontend
onchain
nft
Crea milestones por fase:
Descubrimiento
Decisión
Diseño técnico
Ready for build
Usa status updates semanales por project:
qué se decidió
qué sigue bloqueado
qué decisión falta
Vincula documentos de RFC en cada issue/project para trazabilidad.
Cuando algo madure, conviértelo en issue de ejecución con DoD claro (ready-to-build).
Si quieres, te lo dejo armado ahora mismo en Linear: plantilla de issue + labels + milestones + 1 project de planning para tus ideas.


bueno tengo unos rfcs que quiero desarrollar como proyecto pero todo esta en fase de descubrimiento, me creas entonces nuevas entradas para ello, toma en cuenta esta documentacion para crearle a cada RFC, pero eso si evita ponerle numeraciones aun ya que son solo ideas, eso lo podrias hacer? seria la mejro manera o puedes proponerme algo mejor?


Sí, es una muy buena forma. Voy a proponerte una estructura mejorada para discovery y, de una vez, te la creo en Linear usando tus RFCs actuales pero sin numeraciones en los nombres. Primero extraigo títulos reales desde los archivos para que queden bien nombrados.

Ya detecté todos los RFC, pero para no introducir ruido en nombres voy a normalizarlos con un formato simple (Idea: ...) sin prefijos numéricos. Ahora creo los proyectos e issues de discovery.


no con los que existen pero con estos que te voy a pasar
RFC: Programa notario en Anchor para control de freeze
Crear un programa en Anchor que registre el timestamp de Solana y habilite o deshabilite la lógica de freeze sobre Candy Machines con Metaplex Core + Plugins.
RFC: Microservicio de conciliación on-chain y preparación de distribución de rentas
Diseñar un microservicio que:
	•	consulte con Helius los datos almacenados en el contrato,
	•	lea las direcciones registradas en el programa notario,
	•	compare esas direcciones contra la base de datos de KYC,
	•	capture el balance disponible en la tesorería de Squads,
	•	calcule la distribución correspondiente,
	•	y genere el archivo final para dejar listo el proceso de claim de rentas por parte de los usuarios.
RFC 5 / Microservicio de distribución
define:
	•	lectura desde Helius,
	•	cruce con KYC,
	•	lectura del programa notario,
	•	cálculo de rentas,
	•	generación de archivo de distribución,
	•	estado de claim por usuario.
El microservicio consolidará datos on-chain de Squads, del programa notario y del historial indexado por Helius, los cruzará con la base KYC, calculará la distribución por período y expondrá vistas auditables para UI y proceso de claim.

RFC: Sistema de Trazabilidad y Auditoría de Distribuciones

Objetivo

Diseñar e implementar un sistema de trazabilidad que permita registrar, auditar y consultar de forma confiable todas las operaciones relacionadas con:
	•	tesorería (Squads),
	•	elegibilidad (programa notario),
	•	distribución de rentas,
	•	y claims de usuarios.

⸻

Problema

Actualmente:
	•	Los datos están distribuidos entre on-chain (Squads, programa notario) y off-chain (KYC, backend).
	•	No existe una fuente consolidada de verdad auditable.
	•	Es difícil responder preguntas como:
	•	¿cuánto se le pagó a un usuario en un período?
	•	¿por qué recibió ese monto?
	•	¿ya hizo claim?
	•	¿qué NFTs estaban frozen en ese momento?

⸻

Alcance

Este RFC cubre:
	1.	Captura de datos desde:
	•	Squads (tesorería / vault transactions)
	•	Programa notario (estado + timestamps)
	•	NFTs (estado freeze / delegate)
	•	Helius (historial de transacciones)
	2.	Normalización y almacenamiento off-chain
	3.	Generación de:
	•	snapshots por período
	•	distribución calculada
	•	estado de claim
	4.	Exposición vía API para UI y auditoría


ARQUITECTURA
            ┌──────────────┐
                        │   Squads     │
                        │ (Treasury)   │
            └──────┬───────┘
                                       │
            ┌──────▼───────┐
                        │   Helius     │
                        │ (Indexer)    │
            └──────┬───────┘
                                       │
      ┌────────────▼────────────┐
      │   Microservicio Core    │
      │  (Trazabilidad + Calc)  │
      └──────┬────────┬────────┘
                                  │                                │
     ┌───────▼───┐ ┌──▼────────┐
                 │ Programa  │                              │   DB KYC  │
                 │ Notario   │                                  │ + Users   │
     └───────────┘ └───────────┘
                         │
     ┌───────▼────────┐
                 │   Base de Datos │
                 │ (Trazabilidad) │
     └───────┬────────┘
                         │
         ┌───▼───┐
                     │  API  │
         └───┬───┘
                         │
          ┌──▼──┐
                  │ UI  │
          └─────┘

MODELO DE DATOS (PROPUESTO)
1. treasury_transactions
Registro de movimientos reales desde Squads
- id
- tx_signature
- vault_address
- from_address
- to_address
- amount
- token_mint
- timestamp
- block_slot
2. notary_snapshots
Estado del programa notario
- wallet
- enabled
- frozen
- frozen_since
- last_notarized_at
- slot
3. nft_states
Estado de NFTs relevantes
- mint_address
- owner
- frozen
- delegate
- last_updated_at
4. treasury_snapshots
Estado de tesorería por período
- period (YYYY-MM)
- vault_address
- balance
- captured_at
5. distribution_runs
Ejecuciones de cálculo
- id
- period
- total_amount
- source_vault
- created_at
- status (draft, finalized, executed)
6. distribution_items
Asignación por usuario
- run_id
- wallet
- eligible_nfts
- amount_allocated
- amount_claimed
- claim_status (pending, claimed)
- claim_tx
- claimed_at
7. audit_logs
🔴 CLAVE para trazabilidad
- id
- entity_type (distribution, claim, treasury, notary)
- entity_id
- action (created, updated, claimed, recalculated)
- performed_by (system/user)
- metadata (json)
- timestamp
Flujo de Datos
	1.	Se capturan transacciones desde Helius
	2.	Se consulta estado del programa notario
	3.	Se cruzan wallets con KYC
	4.	Se genera snapshot de tesorería
	5.	Se ejecuta distribución
	6.	Se almacenan resultados
	7.	Se registran eventos en audit_logs

⸻

Casos de Uso que habilita
	•	Ver cuánto ganó un usuario en un mes
	•	Saber si ya hizo claim
	•	Auditar por qué recibió ese monto
	•	Reconstruir estado histórico (time-travel)
	•	Detectar inconsistencias
	•	Generar reportes financieros

⸻

Dependencias

Este RFC depende de:
	•	RFC: Configuración de Squads
	•	RFC: Tesorería de Squads
	•	RFC: Programa notario en Anchor
	•	RFC: Microservicio de distribución

⸻

Decisiones importantes
	•	Fuente de verdad híbrida:
	•	On-chain → eventos verificables
	•	Off-chain → agregación y performance
	•	Uso de Helius como indexador principal
	•	Persistencia de snapshots (no solo estado actual)
	•	Auditoría como feature de primer nivel (no opcional)

⸻

Riesgos
	•	Desincronización entre on-chain y BD
	•	Errores en cálculo de distribución
	•	Ambigüedad en identificación de claims
	•	Coste de indexación si no se cachea bien

⸻

Pendientes / Preguntas abiertas
	•	¿El claim debe registrarse on-chain o basta con evidencia de tx?
	•	¿Se recalculan distribuciones retroactivamente?
	•	¿Se soportan múltiples vaults / monedas?
	•	¿Cómo manejar rollback de errores?

⸻

Valor real de este RFC

Este RFC convierte tu sistema en:
	•	auditable (tipo fintech / compliance)
	•	escalable
	•	explicable (muy importante para usuarios e inversionistas)



2 previous messages
Sí, y ya te lo dejé creado en Linear con nombres sin numeración.

Nuevos projects (discovery)

Notary Program for Freeze Control
On-chain Reconciliation and Distribution Preparation Service
Distribution Service and Claim State
Distribution Traceability and Audit System
Entradas iniciales (issues de discovery)

BRI-5
BRI-6
BRI-8
BRI-7
Incluyen: contexto, alcance discovery, decisiones por tomar, riesgos/preguntas abiertas y salida esperada.

Mejor práctica recomendada para ti ahora:

Mantener estos 4 projects en Backlog/Discovery.
Si quieres reducir complejidad, fusionar luego los dos de distribución (reconciliación + distribución) en uno con 2 fases internas.
Cuando estén maduras las decisiones, ahí sí numeramos y pasamos a ejecución.
Si quieres, en el siguiente paso te los organizo con milestones Discovery, Decision, Ready for Build.


quiero preguntarte tienes acceso a este proyecto que estamos desarrollando y por lo tanto puedes dar respuestas en contexto?


Sí. Tengo acceso al workspace de este proyecto (/Users/jaymusicmachine/Documents/Desarrollo/brids) y al contexto de conversación, así que puedo responder en contexto del repo y de lo que ya hemos definido en Linear.

También puedo leer archivos, revisar estructura, documentación y cambios para darte respuestas aterrizadas al estado real del proyecto.


Quiero que me ayudes a crear unos features, quiero que incluyas todo lo necesario que puedas sobre ellos, te paso las explicaciones, definimos que es lo que falta y despues me haces toda la parte documental tecnica, con la explicacion teorica de que es, que deseo que se haga y demas, principalmente son fixes o cambios a los comportamientos


Perfecto, lo hacemos así y te acompaño end-to-end.

Propuesta de flujo (rápido y ordenado):

Tú me pasas cada feature/fix con explicación funcional.
Yo te devuelvo por cada uno:
Qué entendí
Qué falta definir
Riesgos/impacto
Criterios de aceptación
Dependencias
Validamos contigo esos puntos.
Luego te preparo toda la documentación técnica completa (teoría + objetivo + comportamiento esperado + cambios requeridos + validaciones).
Para avanzar ya, pásame los features en este formato simple (uno por bloque):

Nombre corto:
Problema actual:
Comportamiento esperado:
Qué no debe cambiar:
Prioridad (alta/media/baja):
Cuando me los envíes, te armo el análisis y la documentación en contexto del proyecto.