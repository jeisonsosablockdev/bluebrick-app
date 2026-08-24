# 🏛️ Clean Code & Folder Structure Specification
*(Governance Standard for 4-Layer Architecture & Monorepo Workspaces)*

---

## 1. Visión General y Filosofía de Diseño

Esta especificación define la estructura canónica de directorios y reglas de encapsulamiento para el monorepo **Next.js + Solana**:

1. **Monorepo Workspaces (Nivel Macro)**: Organización estructurada mediante `pnpm-workspace.yaml` centrada en la aplicación web (`apps/web/`), el harness de agentes e IA (`.agents/`), los scripts de automatización (`scripts/`), la base de conocimiento (`knowledge/`) y la suite de pruebas (`tests/`).
2. **Arquitectura Funcional en 4 Capas (Nivel Micro)**: Organización modular en `apps/web/src/` con estricto desacoplamiento y flujo unidireccional de dependencias:
   - **Capa 1: Presentación** (`src/app`, `src/components`)
   - **Capa 2: Aplicación / Consumo** (`src/lib/hooks`, `src/lib/state`)
   - **Capa 3: Dominio / Pipelines** (`src/lib/pipelines`)
   - **Capa 4: Infraestructura y Utilidades** (`src/lib/infrastructure`, `src/lib/utils.ts`)

---

## 2. Mapa Completo de Carpetas de la Arquitectura

```text
/                                         <-- Raíz del Monorepo (pnpm-workspace.yaml)
├── apps/                                 <-- 🌐 APLICACIONES
│   └── web/                              <-- Next.js 16+ App Router
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── app/                      <-- Capa 1: Thin App Router (Rutas, Layouts, Providers)
│           │   ├── layout.tsx
│           │   ├── page.tsx
│           │   ├── providers.tsx
│           │   ├── loading.tsx
│           │   ├── error.tsx
│           │   └── not-found.tsx
│           │
│           ├── components/               <-- Capa 1: Componentes UI Atómicos y Wrappers
│           │   ├── ui/                   <-- Button, Card, Inputs
│           │   ├── wallet/               <-- WalletConnectButton, WalletRuntimeProvider
│           │   ├── theme/                <-- ThemeToggle
│           │   └── motion/               <-- MotionProvider
│           │
│           └── lib/                      <-- Lógica Central y 4 Capas Funcionales
│               ├── hooks/                <-- Capa 2: Custom React Hooks (useSolanaWallet)
│               ├── state/                <-- Capa 2: Estado del Cliente y Preferencias
│               ├── pipelines/            <-- Capa 3: Pipelines de Dominio y Validación
│               ├── infrastructure/       <-- Capa 4: RPC Solana Devnet & Conectores
│               └── utils.ts              <-- Capa 4: Helpers de Formato y Clases
│
├── .agents/                              <-- 🤖 HARNESS DE GOBERNANZA DE AGENTES
│   ├── agents/                           <-- Definiciones de especialistas (architect, solana, qa, etc.)
│   ├── policies/                         <-- Políticas de gobernanza no negociables
│   ├── workflows/                        <-- Ciclos de desarrollo y macros
│   └── hooks.json                        <-- Hooks declarativos del ciclo de vida
│
├── knowledge/                            <-- 📚 OPEN KNOWLEDGE FORMAT (OKF)
│   ├── governance/                       <-- Políticas de monorepo, git, seguridad y calidad
│   ├── architecture/                     <-- ADRs, diagramas de flujo y state machines
│   ├── features/                         <-- Artefactos duales de requerimientos/soluciones
│   ├── fixes/                            <-- Artefactos duales de resolución de bugs
│   ├── api/                              <-- Catálogo de rutas, esquemas y RPC
│   ├── database/                         <-- Modelos de datos y esquemas de persistencia
│   ├── security/                         <-- Modelos de amenazas, auditorías y cumplimiento
│   └── templates/                        <-- Plantillas canónicas para desarrollo
│
├── scripts/                              <-- ⚙️ SCRIPTS DE AUTOMATIZACIÓN Y CI
│   ├── ci/                               <-- Validadores de arquitectura, licencias y ciclo de vida
│   └── task-init.sh                      <-- Inicializador canónico de ramas y tareas
│
└── tests/                                <-- 🧪 SUITE DE TESTING CENTRALIZADA
    ├── harness/                          <-- Pruebas automatizadas de gobernanza de agentes
    └── setup/                            <-- Configuración de Vitest
```

---

## 3. Reglas de Importación e Invariantes de Aislamiento

1. **Flujo de Dependencias Unidireccional**:
   - `Layer 1 (Presentación)` -> Puede importar de `Layer 2`, `Layer 3` y `Layer 4`.
   - `Layer 2 (Aplicación)` -> Puede importar de `Layer 3` y `Layer 4`.
   - `Layer 3 (Dominio)` -> Puede importar de `Layer 4`.
   - `Layer 4 (Infraestructura)` -> No depende de ninguna capa superior.
2. **Prohibición de Acceso a DB Directo en UI**:
   - Los componentes de presentación y hooks tienen estrictamente prohibido importar drivers de base de datos (`pg`, clientes SQL directos).
3. **Solana Devnet Only**:
   - Todos los conectores y configuraciones de RPC deben apuntar exclusivamente a Devnet.
4. **Comentarios Obligatorios en Código**:
   - Cada archivo debe incluir encabezado de capa, bloques TSDoc/JSDoc y pasos numerados (`// Step N:`).
5. **Estrategia de Testing Colocalizado en FDD**:
   - Los tests unitarios y de integración de cada Vertical Slice se escriben colocalizados junto al archivo que prueban (`*.test.ts`, `*.test.tsx`). La carpeta centralizada `tests/` se reserva para el harness de gobernanza (`tests/harness/`) y pruebas E2E de navegador (`tests/e2e/`).

---

## 4. Estándar Canónico de Comentarios y Nomenclatura

### 4.1. Estándar Canónico de Comentarios e Indicaciones en el Código

Todo artefacto de código (`.ts`, `.tsx`, `.rs`, `.sql`) debe incluir obligatoriamente:
1. **Encabezado de Archivo / Módulo**: Declarar explícitamente el rol de capa (`Layer 1: Presentation`, `Layer 2: Application`, `Layer 3: Domain`, `Layer 4: Infrastructure`) y la descripción del archivo.
2. **Bloques JSDoc / TSDoc / Rust doc**: Documentar exhaustivamente cada función, interfaz, tipo, hook y struct con `@param`, `@returns` y descripción de excepciones.
3. **Indicadores de Lógica Paso a Paso (`// Step N: ...`)**: Comentarios inline estructurados que enumeren secuencialmente cada paso de la lógica de negocio o pipeline.
4. **Explicación de Invariantes de Seguridad y Dominio**: Comentarios claros sobre límites de confianza, validaciones de esquema y derivaciones.
