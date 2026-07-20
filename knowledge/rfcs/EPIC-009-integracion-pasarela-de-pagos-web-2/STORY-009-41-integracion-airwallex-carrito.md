---
type: RFC
title: STORY- 009 41 Integracion Airwallex Carrito
description: STORY- 009 41 Integracion Airwallex Carrito - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-009-integracion-pasarela-de-pagos-web-2/STORY-009-41-integracion-airwallex-carrito.md
---

# STORY-009-41-integracion-airwallex-carrito

## Metadata
- Epic: `EPIC-009-integracion-pasarela-de-pagos-web-2`
- Story ID: `STORY-009-41-integracion-airwallex-carrito`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-05`
- Last Updated: `2026-04-06`

## Context
- Problem:
  El checkout actual no permite pago con Airwallex ni carrito multi-item. El flujo depende de un metodo unico y limita conversion.
- Why now:
  Se requiere habilitar pagos no-crypto sin romper Crypto, y aumentar conversion con experiencia de carrito antes de cerrar compra.
- Constraints:
  - Flujo Crypto debe mantenerse intacto.
  - Confirmacion final de compra solo por pago confirmado.
  - Integracion Airwallex backend-only (sin secretos en frontend).
  - Cumplir governance de RFC: no implementar hasta `Decision = approved`.
- Affected paths:
  - `/app` (checkout UI, carrito, estados UX)
  - `/lib` y/o `/packages` (casos de uso, dominio, contratos)
  - `/docs/rfcs`, `/docs/features`, y docs canonicas segun impacto

## Proposal
- Approach summary:
  Construir checkout unificado con orquestacion por metodo de pago mediante arquitectura por capas y adaptadores. Crypto y Airwallex se exponen con la misma interfaz de aplicacion.

- Technical design:

  ### A. Separacion de responsabilidades (arquitectura)
  - `Presentation/UI`:
    - Renderiza carrito, selector de metodo, y estados de pago.
    - No decide montos finales ni completa ordenes.
    - Consume casos de uso via API interna.
  - `Application`:
    - Casos de uso: `AddToCart`, `UpdateCartQty`, `CreateOrderFromCart`, `StartPayment`, `ReconcilePayment`, `CompleteOrder`.
    - Orquesta reglas de negocio y transiciones de estado.
  - `Domain`:
    - Entidades y value objects: `Cart`, `Order`, `PaymentAttempt`, `Money`, `OrderStatus`, `PaymentStatus`.
    - Invariantes: no qty <= 0, no paid sin confirmacion valida, no doble completion.
  - `Infrastructure`:
    - Repositorios (DB), `CryptoPaymentAdapter`, `AirwallexPaymentAdapter`, `WebhookVerifier`, `EventStore`.
    - Integraciones externas encapsuladas, sin contaminar dominio.

  ### B. Modelo de datos minimo
  Se proponen los siguientes esquemas para las entidades críticas.

  - **`orders`**:
    ```sql
    CREATE TYPE order_status AS ENUM ('draft', 'pending_payment', 'paid', 'failed', 'expired', 'canceled');
    CREATE TABLE orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id),
      status order_status NOT NULL DEFAULT 'draft',
      total_amount_minor INT NOT NULL, -- En centavos/unidad menor
      currency CHAR(3) NOT NULL,
      expires_at TIMESTAMPTZ, -- Se define al pasar a pending_payment
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ```
  - **`payment_attempts`**:
    ```sql
    CREATE TYPE payment_attempt_status AS ENUM ('initiated', 'requires_action', 'succeeded', 'failed');
    CREATE TABLE payment_attempts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id),
      provider TEXT NOT NULL, -- e.g., 'airwallex', 'crypto'
      provider_intent_id TEXT NOT NULL, -- ID del PaymentIntent de Airwallex
      status payment_attempt_status NOT NULL DEFAULT 'initiated',
      amount_minor INT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE, -- Clave para evitar doble creación
      client_secret TEXT, -- Secreto para el frontend (Airwallex)
      error_code TEXT,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX ON payment_attempts(order_id);
    CREATE INDEX ON payment_attempts(provider_intent_id);
    ```

  ### C. Estados
  La máquina de estados es fundamental para la resiliencia del sistema.

  - **`Order` States**:
    - `draft`: La orden está siendo construida en el carrito. No hay reserva de stock.
    - `pending_payment`: El usuario ha confirmado la orden. El stock se reserva. La orden tiene un `expires_at`.
    - `paid`: El pago ha sido confirmado por el webhook del proveedor. Se inicia el fulfillment.
    - `failed`: El pago fue rechazado o falló. El stock se libera. El usuario puede reintentar.
    - `expired`: La orden no se pagó antes de `expires_at`. El stock se libera.
    - `canceled`: El usuario canceló explícitamente la orden. El stock se libera.

  - **`PaymentAttempt` (Airwallex) States**:
    - `initiated`: Se ha creado el `PaymentIntent` en Airwallex.
    - `requires_action`: El usuario necesita realizar una acción (e.g., 3D Secure).
    - `succeeded`: Airwallex ha capturado el pago con éxito.
    - `failed`: El pago ha fallado en Airwallex.

  - Regla: `fulfillment` solo cuando `Order = paid`.

  ### D. Flujo de pagos
  1. Usuario confirma carrito.
  2. Backend crea `Order` con `status='pending_payment'`, `expires_at=now() + 30min` y reserva el stock.
  3. Usuario selecciona metodo:
     - `Crypto`: usa adaptador actual.
     - `Airwallex`: backend crea `PaymentIntent` con `request_id` idempotente.
  4. Frontend recibe solo artefactos seguros (`intent_id`, `client_secret`) para completar UX.
  5. Webhook firmado confirma estado real.
  6. Backend aplica transicion transaccional y libera producto.

  ### E. Idempotencia y consistencia
  - Crear orden: clave idempotente por intento checkout.
  - Crear payment intent: `request_id` unico por intento.
  - Consumir webhook: dedupe por `event.id`.
  - Todas las transiciones criticas con lock transaccional.

  ### F. Webhook y reconciliacion
  - Verificar firma HMAC SHA-256 con `x-timestamp + raw_body`.
  - Responder `200` rapido; procesar asincrono.
  - Si hay desfase, job de reconciliacion consulta estado de PaymentIntent y corrige orden.

  ### G. Clean code (criterios de diseno)
  - Sin logica de negocio en componentes UI.
  - Casos de uso pequeños, una responsabilidad y nombres explicitos.
  - Prohibido acceso directo a proveedor desde UI.
  - Sin duplicacion de reglas de estado.
  - Errores tipados por capa; traduccion a mensajes UX en borde de presentacion.

- Alternatives considered:
  - `Hosted Payment Page` (HPP):
    - **Pro**: Menor complejidad de UI y, crucialmente, **minimiza el alcance de cumplimiento PCI DSS**, ya que los datos de la tarjeta nunca tocan nuestros servidores.
    - **Con**: Menor control sobre la experiencia de usuario y el branding del flujo de pago.
  - `Drop-in`:
    - **Pro**: Mayor control sobre la UX, permitiendo una integración visual más nativa.
    - **Con**: **Aumenta significativamente el alcance de PCI DSS** (SAQ A-EP o superior), lo que requiere más esfuerzo de seguridad y auditoría. Mayor complejidad de implementación en el frontend.

- Tradeoffs:
  - **Decisión Clave**: Para la Fase 1, se prioriza la velocidad de entrega y la reducción de riesgos. HPP es la opción superior en este contexto.
  - Estado real por webhook mejora robustez, pero agrega asincronia y complejidad de reconciliacion.
  - Snapshot de precios en orden evita inconsistencia, pero requiere politica clara de expiracion.

## Critique
- Reviewer(s):
  - `staff-engineer`
- Critical findings:
  El diseño inicial era un buen esqueleto, pero carecía de las definiciones concretas necesarias para ser implementable. Los puntos débiles eran:
  1. **Ambigüedad en la UI de Pago**: La elección entre HPP y Drop-in estaba abierta, bloqueando el diseño de frontend y la estrategia de compliance.
  2. **Modelo de Datos y Estados Abstractos**: Las entidades y sus estados no estaban definidos con precisión, impidiendo un razonamiento claro sobre la consistencia y los flujos de error.
  3. **Políticas Operativas No Definidas**: Las reglas de negocio para la expiración de órdenes y la reserva de stock no estaban formalizadas.
- Blocking concerns:
  - La implementación estaba bloqueada por las ambigüedades mencionadas. Sin un modelo de datos y estados claro, y sin una decisión sobre la UI de pago, el riesgo de retrabajo y de construir un sistema frágil era demasiado alto.

## Resolution
- Final approach after critique:
  Se aprueba el diseño con las siguientes resoluciones y detalles técnicos añadidos:
  1. **UI de Pago**: Se adopta **`Hosted Payment Page` (HPP)** para la Fase 1. Esto acelera el desarrollo y minimiza el riesgo de cumplimiento PCI. La arquitectura de adaptadores permite cambiar a `Drop-in` en el futuro sin reescribir la lógica de negocio.
  2. **Modelo de Datos y Estados**: Se han añadido esquemas de DB propuestos y una máquina de estados explícita en la sección `Proposal`.
  3. **Políticas Operativas**: Se formalizan las políticas de expiración (30 min) y reserva de stock (al crear la orden).
- Changes accepted:
  - Toda la sección de `Proposal` ha sido detallada con los esquemas y máquinas de estado.
  - Webhook como fuente de verdad.
  - Idempotencia obligatoria en orden/pago/evento.
  - Fulfillment exclusivamente por `Order = paid`.
- Changes rejected (with rationale):
  - Confirmacion de compra basada en callback/redirect cliente: rechazada por riesgo de inconsistencia y fraude operativo.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-06`
- Decision owner: `staff-engineer`
- Approval notes:
  El diseño ha sido aprobado tras resolver los puntos bloqueantes. Las decisiones clave son:
  1. **Opción de Checkout (Fase 1)**: `Hosted Payment Page (HPP)`.
  2. **Política de Expiración de Orden**: `30 minutos`.
  3. **Política de Reserva de Stock**: El stock se reserva al pasar la orden a `pending_payment` y se libera si la orden `expires`, es `canceled` o `failed`.

## Status
- Current status: `approved`
- Next action:
  Proceder con la implementación de los casos de uso, modelos y adaptadores según el diseño aprobado.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Reglas de carrito (add/update/remove, qty minima, total)
  - Transiciones de estado de orden/pago
  - Idempotencia en casos de uso
- Integration tests:
  - Create order -> start payment -> webhook -> order paid
  - Dedupe de webhook repetido
  - Expiracion y reintento de checkout
- Devnet validation (if applicable):
  - No aplica directo para Airwallex; Crypto mantiene validacion devnet existente.
- Responsive QA (if applicable):
  - 320 / 375 / 768 / 1024
  - Sin overflow horizontal
  - CTA >= 44px

## Traceability
- Related issue(s):
  - `BRI-41`
- Related PR(s):
- Final commit hash(es):
