# EPIC-009-integracion-pasarela-de-pagos-web-2

## Metadata
- Epic ID: `EPIC-009`
- Title: `Integracion Pasarela De Pagos Web 2`
- Status: `draft`
- Owner: `jaymusicmachine`
- Created: `2026-04-05`
- Last Updated: `2026-04-05`

## Scope
- Problem statement:
  Marketplace solo permite pago Crypto en flujo actual y no soporta carrito con cantidades. Esto limita conversion, flexibilidad de pago y experiencia de compra multi-item.
- Business goal:
  Habilitar pago dual (Crypto + Airwallex Tarjeta/Cuenta), con carrito y confirmacion robusta de pago antes de liberar producto.
- Technical goal:
  Introducir arquitectura de checkout desacoplada por metodo de pago, con ordenes y pagos stateful, idempotencia fuerte y reconciliacion por webhook.
- Out of scope:
  - Cambios al flujo funcional de Crypto existente (solo integracion por adaptador).
  - Reescritura de auth/sesiones fuera de lo necesario para checkout.
  - Nuevos metodos de fulfillment distintos a la liberacion actual.
  - Produccion/mainnet hardening en este RFC (se mantiene en fase posterior).

## Success Criteria
- [ ] Usuario puede agregar productos al carrito y ajustar cantidades.
- [ ] Usuario puede pagar por Crypto o Airwallex desde un checkout unificado.
- [ ] Compra solo se marca completada cuando backend confirma pago exitoso.
- [ ] Flujo Crypto mantiene comportamiento actual sin regresiones.
- [ ] Existe trazabilidad de orden/pago/evento para auditoria y soporte.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-009-41 | Integracion Airwallex + Carrito Marketplace | `STORY-009-41-integracion-airwallex-carrito.md` | `draft` | `TBD` | Define arquitectura, estados e integracion de pagos |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-04-05 | STORY-009-41 | RFC creado con diseno base en estado `draft`; pendiente aprobacion final | jaymusicmachine | `STORY-009-41-integracion-airwallex-carrito.md#decision` |

## Critique (Staff Engineer Final Review)
- **Veredicto**: `approved`. El diseño técnico detallado en `STORY-009-41` aborda de manera excelente las preocupaciones de la revisión inicial. La arquitectura propuesta es robusta, escalable y mitiga los riesgos clave.

- **Análisis de la Resolución**:
  1. **Máquina de Estados Definida**: `STORY-009-41#C. Estados` ahora define explícitamente los estados para `Order` y `PaymentAttempt`. Esto proporciona la claridad necesaria para construir un flujo de pago resiliente y manejar casos de éxito, fallo y expiración.
  2. **Estrategia de Consistencia Robusta**: `STORY-009-41#E` y `STORY-009-41#F` detallan una estrategia sólida de idempotencia (claves por intento, `request_id` de proveedor, deduplicación de eventos de webhook) y reconciliación. El uso de webhooks como fuente de verdad, con un job de fallback, es el patrón correcto.
  3. **Análisis de UI de Pago Completo**: `STORY-009-41#Alternatives considered` y `STORY-009-41#Resolution` presentan un análisis claro de los tradeoffs entre `Hosted Payment Page` (HPP) y `Drop-in`. La recomendación de usar **HPP para la Fase 1** es acertada, ya que minimiza drásticamente el alcance de cumplimiento PCI y acelera el time-to-market sin comprometer la arquitectura a largo plazo.

- **Próximos Pasos (Post-Aprobación)**:
  - **Decisiones de Producto**: El equipo debe ahora formalizar las decisiones pendientes listadas en `STORY-009-41#Decision`, específicamente:
    - Confirmar el uso de HPP para la Fase 1.
    - Definir la política de expiración de órdenes y reserva de stock.
  - **Implementación**: Proceder con la implementación siguiendo el diseño aprobado. El plan de pruebas en `STORY-009-41#Test and Validation Plan` es completo y debe ser un requisito para el cierre de la implementación.

Este diseño es un excelente ejemplo de cómo un RFC evoluciona desde un borrador inicial a una propuesta técnica sólida y aprobable. ¡Buen trabajo!

## Risks and Dependencies
- Risks:
  - Doble cobro por reintentos/concurrencia.
  - Estado divergente entre cliente y estado real de pago.
  - Metodos no disponibles por pais/moneda/capacidad de cuenta.
  - Ordenes pendientes sin cierre por expiacion o perdida de callback.
- Dependencies:
  - Credenciales sandbox/prod Airwallex.
  - Configuracion de metodos de pago en cuenta Airwallex.
  - Endpoint webhook publico y seguro.
  - Suite E2E (Playwright/Synpress) para validar journeys.
- Mitigations:
  - Idempotencia en creacion de orden, pago y consumo de eventos.
  - Webhook como fuente de verdad + retrieve API fallback.
  - Filtro de metodos por configuracion/currency/country_code.
  - Politica de expiracion + job de reconciliacion.

## Open Questions
- [ ] Elegir estrategia inicial de UI de pago Airwallex: `Hosted Payment Page` vs `Drop-in`.
- [ ] Definir ventana oficial de expiracion de orden (30 min propuesta).
- [ ] Definir reglas de reserva de stock durante `pending_payment`.
- [ ] Confirmar paises/monedas objetivo para fase 1 (ACH/Apple Pay incluidos).

## Traceability
- Issue(s):
  - `BRI-41`
- PR(s):
- Final commit hash(es):
