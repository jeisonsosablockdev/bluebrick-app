# Feature Plan: Onboarding Quick Tour

## Objective
Implementar un sistema de **Quick Tour** y onboarding para usuarios de primera vez (o con perfiles incompletos), enfocándolos fuertemente a completar la información KYC/Perfil inmediatamente después de hacer la firma criptográfica con su wallet.

## Scope & Target Paths
1. **Frontend / App (`/app`, `/components`)**
   - Incorporar dependencias o desarrollar un tour visual responsivo por pasos (usando modales, tooltips de `shadcn/ui` u hojas deslizantes).
   - Crear un componente de estado o Context que decida si el Tour debe aparecer (por ejemplo, si faltan campos obligatorios como País, Nombre o Email en el perfil obtenido por la API).
   - Rutas probables afectadas: `/app/dashboard/page.tsx` o `components/dashboard/protected-shell.tsx`.
   - Modificar `profile-kyc-module` o añadir visualizaciones resaltadas que lleven a completar el perfil.

## Gitflow & Macros
- **Branch**: `feature/app-quick-tour` (Creado ✅)
- **Macro a ejecutar**: `@frontend-cycle` (Lógica cliente y UI)
- El avance permanecerá en PR esperando revisión manual (`#76` protocol en marcha).

## Status Tracking
---
**Commit #**: `efa4142`
**Status**: in-review

## Visual Redesign (Profile Guided Tour)

### Date
- 2026-04-03

### Scope
- Replace existing quick tour presentation in user profile with a floating glass-effect card.
- Keep onboarding logic from PR #77 intact (incomplete profile trigger + guided steps + dismiss persistence).

### Implemented UX Changes
- Tour moved from fixed top banner to contextual floating card near each profile anchor.
- Added pointer triangle (top/bottom) to visually connect each step with the target field.
- Added cinematic backdrop with subtle blur and spotlight tint to improve focus.
- Preserved progressive dots and step counter while improving readability and spacing.
- Upgraded primary CTA to enhanced glass pill style with stronger glow and hover lift.
- Added compact back button flow for better step navigation.

### Responsive Notes
- Card positioning uses viewport clamping to avoid overflow.
- Mobile behavior falls back to a lower floating placement when anchors are not suitable.
- Action controls preserve touch-friendly targets.
