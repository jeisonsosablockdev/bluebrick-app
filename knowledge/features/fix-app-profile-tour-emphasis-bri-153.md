# fix(app): profile quick tour emphasis copy (BRI-153 / s02)

## Summary

- Agrega negrillas a frases clave del quick tour del perfil.
- Ajusta el copy del paso de contacto para incluir la frase solicitada sobre número de contacto y email.

## Scope

- `components/dashboard/quick-tour-overlay.tsx`
- `tests/components/quick-tour-overlay.test.ts`

## Acceptance

- El quick tour del perfil renderiza en negrilla:
  - `Editar perfil`
  - `nombre y apellido`
  - `Agrega un número de contacto y email`
  - `cuéntanos un poco de quién eres`
  - `tu dirección`
  - `Guardar cambios`
- El render es seguro, sin HTML inyectado.
