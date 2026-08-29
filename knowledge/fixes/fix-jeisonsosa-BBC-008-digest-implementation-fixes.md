# Problem Spec: digest-implementation-fixes

## What problem exists
Existen dos problemas principales a resolver en este fix:
1. **Login Fallback con WorkOS**: Al iniciar sesión con una cuenta de Google mediante WorkOS, el usuario es enviado a un perfil genérico porque la aplicación hace fallback a datos semilla ("seeded initial portfolio fixtures"). Esto ocurre por un error en `UserRepository.findById` donde no encuentra la base de datos `neondb` (está hardcodeada o mal configurada).
2. **Implementación de Digest de Archivos**: Existen múltiples bugs y comportamientos anómalos asociados a la lógica y manejo del "digest" (procesamiento/hash/ingestión) de archivos. El objetivo es cazar y reparar de forma exhaustiva todos los bugs vinculados a este flujo.

## Why it matters
1. El login fallido bloquea a los usuarios reales para acceder a su portafolio real, degradando severamente la funcionalidad principal del producto.
2. Los bugs en el digest de archivos corrompen la integridad de los datos procesados o fallan silenciosamente, impactando el pipeline de ingestión y la confiabilidad del sistema.

## What outcome is expected
- La conexión a la base de datos para recuperar perfiles de usuario pos-login debe usar las credenciales y el nombre de DB correctos (sin hardcodear `neondb`), permitiendo a los usuarios ver sus datos reales.
- El sistema de digest de archivos debe ser depurado exhaustivamente; todos los fallos en la lectura, validación y procesamiento (digest) de archivos deben estar resueltos.

## What gaps exist today
- Posible variable de entorno mal leída o valor `neondb` estático en el setup de PostgreSQL / DB Repositories.
- Faltan pruebas o robustez en la implementación del pipeline de archivos, lo que actualmente genera cuellos de botella o fallas en el procesamiento del digest.

## What questions remain open
- ¿Hay algún tipo de archivo específico en el que el digest falle más a menudo (Excel, PDF, video)?
- ¿La corrección de la conexión de DB en el login requiere cambios en la infraestructura de CI/CD para que pasen correctamente las URLs de producción?
