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
