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
