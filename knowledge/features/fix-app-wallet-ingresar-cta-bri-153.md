# fix(app): wallet cta ingresar with icon (BRI-153 / s01)

## Summary

- Renombra el CTA principal del `WalletModal` en español de `Wallet` a `Ingresar`.
- Agrega un icono de wallet antes del texto del botón.

## Scope

- `components/WalletModal.tsx`
- `tests/components/wallet-modal-header-cta.test.tsx`

## Acceptance

- El botón principal visible en header muestra icono + texto.
- En locale `es`, el texto visible es `Ingresar`.
- El cambio queda cubierto por test de componente.
