# Fix BRI-171 Investor Overview Placeholder States

## Problema

El modulo `Investor Dashboard / Overview` ya consume el endpoint real de BRI-171, pero todavia puede renderizar fallbacks que se perciben como placeholders de producto:

- `unknown` para KYC o compliance cuando el perfil aun no tiene ese dato.
- `0` junto a `No finalized run` cuando no existe una corrida de distribucion preparada/finalizada.
- Texto de actividad vacia que no distingue claramente entre ausencia real de eventos y placeholder.

Esto crea confusion porque el usuario espera una superficie basada en datos reales, no etiquetas tecnicas ni valores simulados.

## Por que importa

El Overview es una pantalla sensible para inversionistas. Si el sistema no tiene un dato, debe decirlo explicitamente. Un fallback tecnico puede parecer dato corrupto, mock residual o una promesa financiera incompleta.

## Resultado esperado

- No se renderiza `unknown` en la UI del Overview.
- La metrica de distribuciones no muestra un monto como si fuera dato calculado cuando no hay token/corrida disponible.
- Los estados vacios se comunican como datos aun no disponibles o no registrados, sin introducir mocks.

## Fuera de alcance

- No cambia la fuente de verdad server-side de BRI-171.
- No agrega calculos financieros nuevos.
- No cambia BRI-6 ni prepara distribuciones desde Overview.
- No toca rutas de stake, mint, marketplace ni transacciones Solana.

## Preguntas abiertas

Ninguna para este fix. La decision es de presentacion: datos ausentes se muestran como ausentes, no como placeholders tecnicos.
