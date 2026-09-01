-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/004_dashboard_excel_entities.sql
-- @description Layer 4: Infrastructure - DDL Schema Migration for Full Multi-Sheet Excel Dashboard Digestion.
-- Mirrors 1:1 all operational sheets of DASH-BOARD-Blue-Brick-Panel-Administracion.xlsx:
--   1. dashboard_projects (Sheet: Proyectos)
--   2. dashboard_investors (Sheet: Inversionistas)
--   3. dashboard_investments (Sheet: Inversiones)
--   4. dashboard_project_phases (Sheet: Fases_Proyecto)
--   5. dashboard_opportunities (Sheet: Oportunidades)
--   6. dashboard_reinvestment_transactions (Sheet: Transacciones_Reinversion)
--   7. dashboard_investor_summaries (Sheet: Resumen_Dashboard)
-- Invariants:
--   - Strict foreign key constraints with ON DELETE CASCADE / SET NULL.
--   - Check constraints on numeric monetary bounds and valid enum statuses.
--   - B-Tree indexes on primary search filters and foreign keys.
-- ==============================================================================

-- Step 1: Create dashboard_projects table (mirrors Sheet 'Proyectos ')
CREATE TABLE IF NOT EXISTS dashboard_projects (
  id_inversion VARCHAR(64) PRIMARY KEY, -- SKU / ID ej. 'BG-01', 'BK-02', 'CW-04'
  nombre VARCHAR(255) NOT NULL,        -- ej. 'BUSH GARDEN', 'BROOKSVILLE'
  direccion TEXT,                      -- Dirección del activo inmobiliario
  tipo_proyecto VARCHAR(64) NOT NULL DEFAULT 'Fix & Flip', -- 'Fix & Flip', 'New Construction'
  fecha_activacion DATE,               -- Fecha de inicio o activación operativa
  timing_months INTEGER NOT NULL DEFAULT 6, -- Duración estimada en meses
  drive_url TEXT,                      -- Enlace a carpeta de Google Drive
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create dashboard_investors table (mirrors Sheet 'Inversionistas')
CREATE TABLE IF NOT EXISTS dashboard_investors (
  id_inversionista VARCHAR(64) PRIMARY KEY, -- ID ej. 'INV-001', 'INV-002'
  nombre VARCHAR(255) NOT NULL,             -- ej. 'ESTEBAN CEBALLOS'
  email VARCHAR(255) NOT NULL UNIQUE,       -- Correo de autenticación del inversor
  tipo_inversionista VARCHAR(64) NOT NULL DEFAULT 'Privado', -- 'Privado', 'Institucional', 'Semilla'
  fecha_ingreso DATE,                       -- Fecha de ingreso del inversionista
  timing_months INTEGER NOT NULL DEFAULT 6, -- Plazo operativo preferido
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create dashboard_investments table (mirrors Sheet 'Inversiones')
CREATE TABLE IF NOT EXISTS dashboard_investments (
  id VARCHAR(128) PRIMARY KEY,              -- ID único 'INV_BG-01_INV-001'
  id_inversion VARCHAR(64) NOT NULL REFERENCES dashboard_projects(id_inversion) ON DELETE CASCADE,
  id_inversionista VARCHAR(64) REFERENCES dashboard_investors(id_inversionista) ON DELETE CASCADE,
  nombre_proyecto VARCHAR(255) NOT NULL,
  ciudad VARCHAR(128) NOT NULL DEFAULT 'TAMPA BAY',
  tipo_propiedad VARCHAR(64) NOT NULL DEFAULT 'Residencial',
  tipo_proyecto VARCHAR(64) NOT NULL DEFAULT 'Fix & Flip',
  monto_invertido NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  roi_pct NUMERIC(6, 4) NOT NULL DEFAULT 0.1500, -- ej. 0.1600 = 16.0%
  estado VARCHAR(32) NOT NULL DEFAULT 'Activa',   -- 'Activa', 'Concluida'
  fecha_inicio DATE,
  duracion_meses INTEGER NOT NULL DEFAULT 6,
  rango_esperado VARCHAR(64) DEFAULT '6-12 MESES',
  fecha_timing DATE,
  allocation_pct NUMERIC(6, 4) DEFAULT 1.0000,
  imagen_url TEXT,
  avance_fase_pct NUMERIC(6, 4) NOT NULL DEFAULT 0.0000, -- ej. 0.5714 = 57.14%
  fase_actual VARCHAR(128) DEFAULT '1. Adquisición',
  ganancia_proyectada NUMERIC(14, 2) DEFAULT 0.00,
  rendimiento_devengado NUMERIC(14, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_positive_investment_amount CHECK (monto_invertido >= 0)
);

-- Step 4: Create dashboard_project_phases table (mirrors Sheet 'Fases_Proyecto')
CREATE TABLE IF NOT EXISTS dashboard_project_phases (
  id VARCHAR(128) PRIMARY KEY,             -- ej. 'FASE-0001_BG-01'
  id_fase VARCHAR(64) NOT NULL,            -- ej. 'FASE-0001'
  id_inversion VARCHAR(64) NOT NULL REFERENCES dashboard_projects(id_inversion) ON DELETE CASCADE,
  orden INTEGER NOT NULL,                  -- 1 a 14
  nombre_fase VARCHAR(255) NOT NULL,       -- ej. '1. Adquisición', '9. Acabados'
  estado VARCHAR(32) NOT NULL DEFAULT 'Pendiente', -- 'Completada', 'En curso', 'Pendiente', 'No aplica'
  fecha_inicio DATE,
  fecha_fin DATE,
  imagen_url_1 TEXT,                       -- Foto de avance 1
  imagen_url_2 TEXT,                       -- Foto de avance 2
  imagen_url_3 TEXT,                       -- Foto de avance 3
  clave_en_curso VARCHAR(64),              -- SKU cuando está en curso (ej. 'BG-01')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_phase_order_range CHECK (orden >= 1 AND orden <= 20),
  CONSTRAINT chk_dashboard_phase_status CHECK (estado IN ('Completada', 'En curso', 'Pendiente', 'No aplica'))
);

-- Step 5: Create dashboard_opportunities table (mirrors Sheet 'Oportunidades')
CREATE TABLE IF NOT EXISTS dashboard_opportunities (
  id_oportunidad VARCHAR(64) PRIMARY KEY,  -- ej. 'MB-05'
  nombre_proyecto VARCHAR(255) NOT NULL,   -- ej. 'MULBERRY'
  ciudad VARCHAR(128) NOT NULL DEFAULT 'TAMPA',
  roi_estimado NUMERIC(6, 4) NOT NULL DEFAULT 0.1600, -- ej. 0.1600 = 16.0%
  ticket_minimo NUMERIC(14, 2) NOT NULL DEFAULT 25000.00,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  gradient TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#16223B 0%,#1F0E14 100%)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 6: Create dashboard_reinvestment_transactions table (mirrors Sheet 'Transacciones_Reinversion')
CREATE TABLE IF NOT EXISTS dashboard_reinvestment_transactions (
  id_transaccion VARCHAR(64) PRIMARY KEY,  -- ej. 'TRX-001'
  id_inversionista VARCHAR(64) REFERENCES dashboard_investors(id_inversionista) ON DELETE CASCADE,
  id_oportunidad VARCHAR(64),              -- Referencia a oportunidad (ej. 'OPP-001' o 'MB-05')
  id_inversion_origen VARCHAR(64),
  monto NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(32) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Confirmada', 'Rechazada'
  fecha_confirmacion DATE,
  id_inversion_generada VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 7: Create dashboard_investor_summaries table (mirrors Sheet 'Resumen_Dashboard')
CREATE TABLE IF NOT EXISTS dashboard_investor_summaries (
  id_inversionista VARCHAR(64) PRIMARY KEY REFERENCES dashboard_investors(id_inversionista) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  patrimonio_total_invertido NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  rendimiento_acumulado NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  capital_total_actual NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  roi_ponderado NUMERIC(6, 4) NOT NULL DEFAULT 0.1500,
  num_activas INTEGER NOT NULL DEFAULT 0,
  num_concluidas INTEGER NOT NULL DEFAULT 0,
  capital_disponible_reinversion NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  ganancia_proyectada_total NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 8: B-Tree Indexes for performance and foreign key fast lookups
CREATE INDEX IF NOT EXISTS idx_dash_investments_inversionista ON dashboard_investments(id_inversionista);
CREATE INDEX IF NOT EXISTS idx_dash_investments_inversion ON dashboard_investments(id_inversion);
CREATE INDEX IF NOT EXISTS idx_dash_project_phases_inversion_orden ON dashboard_project_phases(id_inversion, orden);
CREATE INDEX IF NOT EXISTS idx_dash_investors_email ON dashboard_investors(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_dash_opportunities_activa ON dashboard_opportunities(activa);

