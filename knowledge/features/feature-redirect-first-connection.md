---
type: Feature Spec
title: Feature Redirect First Connection
description: Feature Redirect First Connection - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-redirect-first-connection.md
---

# Redirect on First Wallet Connection

El objetivo de este feature es interceptar el flujo de autenticación justo después de que el usuario firme exitosamente el mensaje SIWS, para redirigirlo automáticamente a `/protected/perfil` si la cuenta está incompleta.

## Contexto & Reglas de UX Aprobadas

- Un perfil se considerará **incompleto** si le falta el nombre (`firstName`), el correo electrónico (`email`) o el teléfono (`phone`).
- Este comportamiento de redirección actuará cada vez que la wallet sea conectada e interrumpirá comportamientos de navegación o compras, obligando a rellenar la info faltante. Es necesario para el modelo de negocio y envío de notificaciones.

## Detalles Técnicos de Implementación

### [MODIFY] `components/WalletModal.tsx`
- Se modificará la lógica dentro de la función `handlePrimaryAction`.
- Tras verificarse la firma con `startSiws` y recargar estado mediante `fetchAuthMe()` (dejando al usuario autenticado en la app), se hará una petición background tipo `fetch` a `GET /api/protected/profile`.
- Se validarán los campos requeridos en el objeto JSON retornado (o se interceptará un posible error 404).
- Si resultan faltar datos: `!profile.firstName || !profile.email || !profile.phone`, se cerrará de inmediato la UI modal (`setIsOpen(false)`) y se re-enrutará al cliente imperativamente (`router.push("/protected/perfil")`).
- La variable existente `verifiedResult.isNewUser` cubrirá los casos puramente nuevos en base al auth, pero a esto se le sumaran los casos de perfil incompleto recurrente.

---
**Commit #**: `d194007`
**Status**: Completed
