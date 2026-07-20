---
type: Feature Spec
title: Feature App Mobile Pill Phantom
description: Feature App Mobile Pill Phantom - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-app-mobile-pill-phantom.md
---

# [Mobile] Pill "Abrir en Phantom" con fallback de instalacion

## Contexto
- Se agrego un pill discreto y exclusivo para mobile que invita a abrir el sitio dentro de Phantom.
- El objetivo es mejorar la continuidad del flujo wallet-first en dispositivos moviles sin afectar desktop.

## Implementacion
- Archivo principal: `components/WalletModal.tsx`.
- Reglas aplicadas:
  - El pill solo se renderiza en viewport pequeno (`<= 639px`) y user-agent movil.
  - Si se detecta entorno Phantom in-app (`isPhantom`/user-agent Phantom), el pill no se muestra.
  - En desktop no se muestra el pill ni se ejecuta deeplink.
  - El CTA usa deeplink `https://phantom.app/ul/browse/<url-encoded>`.
  - Alto minimo tactil de 44px (`min-h-11`).

## Fallback UX
- Si el deeplink no saca la pagina de foreground despues de un timeout corto, se muestra fallback:
  - Mensaje breve indicando que no se pudo abrir Phantom automaticamente.
  - CTA `Instalar Phantom` hacia `https://phantom.app/download`.
  - Boton para cerrar el fallback.

## Criterios cubiertos
- Pill visible y usable en 320px/375px sin romper layout.
- Apertura por deeplink en mobile cuando Phantom esta disponible.
- Desktop sin cambios de comportamiento.
- Touch target >= 44px.
- Fallback breve con CTA de instalacion cuando no abre Phantom.
