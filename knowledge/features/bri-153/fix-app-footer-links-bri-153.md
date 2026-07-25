---
type: Feature Spec
title: Fix App Footer Links BRI- 153
description: Fix App Footer Links BRI- 153 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-153/fix-app-footer-links-bri-153.md
---

# fix(app): connect footer links to live destinations (BRI-153 / s04)

## Summary

- Conecta `Propiedades` del footer con el marketplace real.
- Conecta `Contacto` del footer con el formulario `Contacta con nosotros` dentro de transparencia.
- Expone un ancla estable para permitir deep links al formulario.

## Scope

- `components/sections/footer.tsx`
- `components/sections/contact-form.tsx`
- `tests/components/footer-links.test.ts`
- `tests/components/contact-form-section.test.ts`

## Acceptance

- `Propiedades` navega a `/marketplace`.
- `Contacto` navega a `/transparencia#contact-form`.
- La sección del formulario de transparencia expone `id="contact-form"`.
- El cambio no introduce enlaces placeholder en el footer.
