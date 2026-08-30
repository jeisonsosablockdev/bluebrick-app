# 📘 Guía Operativa y Manual de Configuración: AI-Augmented Ingestion Pipeline

**Sistema:** BlueBrick Platform — Ingestion Pipeline & Schema Alignment  
**Epic:** `EPIC-001` (`BBC-7`)  
**Versión:** `1.0.0`  
**Última actualización:** 2026-08-27  
**Responsable:** `jaymusicmachine` / AI Architect Subagent  

---

## 1. 📋 Resumen del Sistema

El pipeline de ingesta asistido por IA automatiza la extracción, sanitización, optimización y persistencia de información inmobiliaria desde **Google Drive** hacia la base de datos relacional PostgreSQL (**Neon**) y almacenamiento en CDN (**Vercel Blob Storage**).

### Componentes Clave:
1. **Google Drive Changes API:** Detección diferencial de archivos modificados/creados mediante tokens de página.
2. **Quality Gate & Sharp Optimizer:** Normalización WebP a calidad 85, eliminación de metadatos sensibles EXIF/GPS y límites de dimensiones (400px–2048px).
3. **Gemini Vision Smart Crop:** Inferencia de puntos focales visuales (`focalX`, `focalY`) sobre miniaturas de 256x256 con fallback determinístico al centro `(0.5, 0.5)`.
4. **Multimodal Contract Parser & Validador NIT:** Extracción de datos legales de contratos PDF con validación algorítmica de dígito de verificación DIAN (Módulo 11).
5. **SheetJS Streaming Parser & Formula Neutralizer:** Ingesta de hojas de cálculo XLSX/CSV con protección estricta contra inyección de fórmulas CSV/DDE.
6. **Scoring Engine 80/20 & Anomaly Veto:** Clasificación automática con 80% reglas determinísticas y 20% IA, forzando revisión humana en registros con inconsistencias.
7. **Human-in-the-Loop (HITL) Review Panel:** Interfaz dividida con visor sandboxed contra XSS y Server Actions protegidas por RBAC (`ADMIN` / `COMPLIANCE`).

---

## 2. 💻 Requisitos Previos de Software Local

Asegúrate de tener instaladas las siguientes herramientas en tu entorno de desarrollo:

- **Node.js:** Versión `>= 20.18.0` (o LTS `>= 22.x`).
- **pnpm:** Versión `>= 10.0.0` (gestor de paquetes monorepo).
- **Git:** Para control de versiones y gobernanza de ramas.
- **Sharp / libvips:** Los binarios de plataforma para macOS/Linux se instalan automáticamente mediante pnpm (`sharp` y `@img/sharp-*`).

### Instalación de dependencias del proyecto:
```bash
# Clonar e instalar en la raíz del repositorio
pnpm install
```

---

## 3. 🔑 Cuentas y Servicios Externos Necesarios

Para operar el sistema en su totalidad se requieren 5 servicios externos:

```mermaid
flowchart TD
    GCP[1. Google Cloud Platform\nService Account & Drive API] --> Driver[Google Drive Adapter]
    Gemini[2. Google AI Studio\nGemini 2.5 Flash API] --> AI[Vision & Document Extraction]
    Blob[3. Vercel Blob\nObject Storage CDN] --> Media[Media CDN Storage]
    Neon[4. Neon Tech\nServerless PostgreSQL] --> DB[(Relational DB Repositories)]
    WorkOS[5. WorkOS\nAuthKit & RBAC Roles] --> HITL[HITL Review Panel Security]
```

---

### A. 🌐 1. Google Cloud Platform (Google Drive API)

Se utiliza una **Cuenta de Servicio (Service Account)** para acceder de forma desatendida a las carpetas compartidas de Google Drive mediante autenticación server-to-server con JWT RS256.

#### Paso a paso de configuración:
1. Ingresa a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo (ej. `bluebrick-ingestion-prod`).
3. Ve a **APIs & Services > Library** y busca **Google Drive API**. Haz clic en **Enable**.
4. Ve a **IAM & Admin > Service Accounts** y haz clic en **Create Service Account**:
   - **Service account name:** `bluebrick-drive-sync`
   - **Service account ID:** `bluebrick-drive-sync@bluebrick-ingestion-prod.iam.gserviceaccount.com`
5. Haz clic en la cuenta de servicio creada, ve a la pestaña **Keys > Add Key > Create new key** y selecciona **JSON**.
6. Se descargará un archivo JSON con la siguiente estructura:
   ```json
   {
     "type": "service_account",
     "project_id": "bluebrick-ingestion-prod",
     "private_key_id": "xxxx",
     "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
     "client_email": "bluebrick-drive-sync@bluebrick-ingestion-prod.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token"
   }
   ```
7. **IMPORTANTE (Compartir Carpetas en Google Drive):**
   - Ve a tu Google Drive.
   - Crea la carpeta raíz para los proyectos inmobiliarios (ej. `Proyectos Inmobiliarios`).
   - Haz clic derecho en la carpeta > **Compartir**.
   - Agrega el correo de la cuenta de servicio (`client_email`) con rol de **Lector** (Viewer) o **Editor** si requieres marcar archivos procesados.
   - Copia el **Folder ID** de la URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`).

---

### B. 🤖 2. Google AI Studio (Gemini Vision & Extraction)

Proporciona capacidades multimodales para análisis de imágenes (Smart Focal Crop), lectura de contratos PDF y generación de etiquetas semánticas para videos.

#### Paso a paso de configuración:
1. Ingresa a [Google AI Studio](https://aistudio.google.com/).
2. Inicia sesión con tu cuenta de Google.
3. Haz clic en **Get API Key** y selecciona **Create API key in new project**.
4. Copia la clave generada (`AIzaSy...`).
5. La clave se configura en la variable de entorno `GEMINI_API_KEY`.

---

### C. 📦 3. Vercel Blob Storage (Almacenamiento CDN)

Almacena de forma permanente las imágenes optimizadas en WebP y los videos de avance de obra con entrega ultrarrápida en el Edge.

#### Paso a paso de configuración:
1. Ingresa al [Dashboard de Vercel](https://vercel.com/dashboard).
2. Selecciona tu proyecto y ve a la pestaña **Storage**.
3. Haz clic en **Create Database** y selecciona **Blob**.
4. Asigna un nombre al almacén (ej. `bluebrick-media-blob`).
5. Ve a la pestaña **Settings** del almacén Blob y copia el token de acceso:
   `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...`

---

### D. 🐘 4. Neon Tech (PostgreSQL Serverless)

Almacena los registros de auditoría de sincronización (`sync_records`), activos multimedia (`media_assets`) y clientes inversionistas canónicos (`clients`).

#### Paso a paso de configuración:
1. Ingresa a [Neon Console](https://console.neon.tech/).
2. Crea un nuevo proyecto (ej. `bluebrick-db`).
3. En el panel principal, copia el connection string en formato Pooled/Direct:
   `DATABASE_URL=postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Ejecuta las migraciones de base de datos (ver Sección 5).

---

### E. 🔐 5. WorkOS AuthKit (Autenticación y RBAC)

Protege el panel de revisión asistida (HITL) mediante control de acceso basado en roles (`ADMIN` y `COMPLIANCE`).

#### Paso a paso de configuración:
1. Ingresa al [Dashboard de WorkOS](https://dashboard.workos.com/).
2. Configura tu aplicación AuthKit.
3. Define los roles de usuario:
   - `ADMIN`: Administradores con permiso total de aprobación/rechazo.
   - `COMPLIANCE`: Oficiales de cumplimiento legal y tributario.
4. Obtén las credenciales `WORKOS_API_KEY`, `WORKOS_CLIENT_ID` y `WORKOS_COOKIE_PASSWORD`.

---

## 4. ⚙️ Configuración de Variables de Entorno (`.env.local`)

Crea un archivo `.env.local` en la raíz del proyecto (`/apps/web/.env.local` o en la raíz) con las siguientes variables:

```env
# ==============================================================================
# Google Cloud Platform - Service Account & Drive Sync
# ==============================================================================
GOOGLE_SERVICE_ACCOUNT_EMAIL="bluebrick-drive-sync@bluebrick-ingestion-prod.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID="1A2B3C4D5E6F7G8H9I0J"

# ==============================================================================
# Google Gemini Multimodal AI
# ==============================================================================
GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ==============================================================================
# Vercel Blob Storage
# ==============================================================================
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"

# ==============================================================================
# PostgreSQL Database (Neon Serverless)
# ==============================================================================
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# ==============================================================================
# WorkOS Authentication & RBAC
# ==============================================================================
WORKOS_API_KEY="sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
WORKOS_CLIENT_ID="client_XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
WORKOS_COOKIE_PASSWORD="a_secure_random_string_of_at_least_32_chars"
```

---

## 5. 🗄️ Ejecución de Migraciones de Base de Datos

Las tablas necesarias para la ingesta se encuentran definidas en la migración `003_ai_ingestion_tables.sql`.

### Tablas creadas:
- `sync_records`: Registro de auditoría, payloads en JSONB, puntuación de confianza y errores de validación.
- `media_assets`: URLs de Vercel Blob, coordenadas de punto focal AI (`focal_x`, `focal_y`) y etiquetas.
- `clients`: Clientes canónicos, NIT validado por Módulo 11, valores de contratos y estado.

### Para ejecutar la migración:
Puedes aplicar el script SQL directamente en la consola de Neon SQL Editor o mediante el comando de base de datos:
```bash
# Verificación de integridad de migraciones
pnpm test tests/unit/neon-db-structural.test.ts
```

---

## 6. 🚀 Guía de Operación Paso a Paso

### 1. Subida de Archivos a Google Drive
Deposita los archivos en la estructura de carpetas compartida con la Service Account:
```text
Proyectos Inmobiliarios/
├── Torre_Horizonte/
│   ├── Fotos/
│   │   ├── Fachada_Principal.jpg
│   │   └── Zona_Humeda_Piscina.png
│   ├── Videos/
│   │   └── Recorrido_Dron_Avance_Marzo.mp4
│   ├── Contratos/
│   │   └── Promesa_Compraventa_Apto101.pdf
│   └── Inversionistas/
│       └── Reporte_Aportes_2026.xlsx
```

### 2. Ejecución del Differential Polling Engine
El servicio de sincronización consulta los cambios en Drive:
- Si es un **PDF**: Se analiza mediante Gemini multimodal, se valida el NIT con Módulo 11 y se genera el registro en `sync_records`. Si el score $\ge 90\%$ y no hay anomalías críticas, se publica automáticamente como `PROCESSED`.
- Si es una **Imagen**: Sharp valida dimensiones (mínimo 400px), convierte a WebP 85, elimina GPS/EXIF y Gemini infiere el punto focal óptimo antes de subirla a Vercel Blob.
- Si es un **Video**: Se valida que no supere 250MB, se extraen etiquetas semánticas (`#cimentacion`, `#dron`) y se transmite a CDN.
- Si es un **Excel/CSV**: Se parsean las filas higienizando fórmulas (`'=1+1`) y se extraen los clientes en lote.

### 3. Revisión en el Panel Human-in-the-Loop (HITL)
Si un documento presenta anomalías (ej. NIT mal digitado, firma borrosa o score $< 90\%$):
1. El oficial de cumplimiento ingresa a `/dashboard/ingestion-review`.
2. Se muestra la **Vista Dividida (Split View)**:
   - **Izquierda:** Visor seguro y aislado del documento original (sin riesgo de scripts maliciosos).
   - **Derecha:** Formulario asistido con los datos extraídos por IA y alertas de anomalías.
3. El revisor corrige los campos necesarios y hace clic en **"Aprobar y Publicar"** o ingresa un motivo y hace clic en **"Rechazar"**.
4. La Server Action re-valida con Zod, actualiza la base de datos de forma transaccional y promueve el registro a `PROCESSED`.

### 4. Visualización en Galería y Dashboard
- La galería responsiva en `/dashboard/projects/[slug]` renderiza las imágenes con `objectPosition` centrado dinámicamente en el punto focal de la IA con **Cumulative Layout Shift (CLS) = 0**.
- Los clientes y contratos aprobados aparecen consolidados en la vista de clientes en `/dashboard/clients`.

---

## 7. 🧪 Validación de Salud del Sistema

Para confirmar que todo el sistema y sus 4 capas se encuentran funcionando al 100%, ejecuta:

```bash
# Validación completa (Arquitectura 4 capas, Tests, TypeScript, Linter, Licencias, Harness)
pnpm validate
```

**Resultado esperado:**
- ✅ `4-Layer architecture governance check passed`
- ✅ `204 / 204 tests passed`
- ✅ `0 TypeScript errors`
- ✅ `0 ESLint errors`
- ✅ `Task Lifecycle PHASE_7_VALIDATED`
