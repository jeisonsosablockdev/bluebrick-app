-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/002_seed_initial_properties.sql
-- @description Layer 4: Infrastructure - DML Seed Data Migration for BlueBrick Investor Platform.
-- Populates initial verified investor (Sofía Martínez) and 5 portfolio assets ($163,000 USD, 13.7% ROI).
-- ==============================================================================

-- Step 1: Insert Demo Investor User (Sofía Martínez)
INSERT INTO users (id, email, first_name, last_name, tier)
VALUES (
  'user_sofia_martinez',
  'sofia.martinez@bluebrick.investments',
  'Sofía',
  'Martínez',
  'Inversionista Privada'
)
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  tier = EXCLUDED.tier;

-- Step 2: Insert Real Estate Properties
INSERT INTO properties (id, name, city, type, target_amount, roi, status, timing, months_left, gradient)
VALUES
  (
    'prop_vista_norte',
    'Residencial Vista Norte',
    'Bogotá, Colombia',
    'Residencial',
    45000.00,
    14.20,
    'activa',
    'Noviembre 2026',
    4,
    'linear-gradient(135deg,#2F8F6B 0%,#173F30 100%)'
  ),
  (
    'prop_torre_sabana',
    'Torre Corporativa Sabana',
    'Bogotá, Colombia',
    'Comercial',
    60000.00,
    11.80,
    'activa',
    'Marzo 2027',
    8,
    'linear-gradient(135deg,#C41230 0%,#4A0F1A 100%)'
  ),
  (
    'prop_bodega_cota',
    'Bodega Industrial Cota',
    'Cota, Colombia',
    'Industrial',
    25000.00,
    18.50,
    'concluida',
    'Concluida — Junio 2026',
    0,
    'linear-gradient(135deg,#57B98C 0%,#0A1220 100%)'
  ),
  (
    'prop_lote_chia',
    'Lote Comercial Chía',
    'Chía, Colombia',
    'Comercial',
    18000.00,
    9.40,
    'activa',
    'Enero 2027',
    6,
    'linear-gradient(135deg,#E8495F 0%,#3B1018 100%)'
  ),
  (
    'prop_apartaestudios_laureles',
    'Apartaestudios Laureles',
    'Medellín, Colombia',
    'Residencial',
    15000.00,
    13.00,
    'activa',
    'Agosto 2026',
    1,
    'linear-gradient(135deg,#3F7D63 0%,#0A1220 100%)'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  roi = EXCLUDED.roi,
  status = EXCLUDED.status,
  timing = EXCLUDED.timing,
  months_left = EXCLUDED.months_left;

-- Step 3: Insert User Portfolio Investments (Total = $163,000 USD)
INSERT INTO user_investments (id, user_id, property_id, invested_amount)
VALUES
  ('inv_sofia_001', 'user_sofia_martinez', 'prop_vista_norte', 45000.00),
  ('inv_sofia_002', 'user_sofia_martinez', 'prop_torre_sabana', 60000.00),
  ('inv_sofia_003', 'user_sofia_martinez', 'prop_bodega_cota', 25000.00),
  ('inv_sofia_004', 'user_sofia_martinez', 'prop_lote_chia', 18000.00),
  ('inv_sofia_005', 'user_sofia_martinez', 'prop_apartaestudios_laureles', 15000.00)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Insert Featured Reinvestment Opportunities
INSERT INTO reinvestment_opportunities (id, title, city, projected_roi, min_investment, days_left, gradient)
VALUES
  (
    'opp_calle_93',
    'Edificio Calle 93',
    'Bogotá, Colombia',
    16.50,
    30000.00,
    3,
    'linear-gradient(135deg,#C41230 0%,#111B2E 100%)'
  ),
  (
    'opp_centro_logistico',
    'Centro Logístico Medellín',
    'Medellín, Colombia',
    14.00,
    20000.00,
    7,
    'linear-gradient(135deg,#2F8F6B 0%,#111B2E 100%)'
  ),
  (
    'opp_campestre_anapoima',
    'Condominio Campestre Anapoima',
    'Cundinamarca, Colombia',
    15.20,
    15000.00,
    12,
    'linear-gradient(135deg,#57B98C 0%,#0D1526 100%)'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  projected_roi = EXCLUDED.projected_roi,
  min_investment = EXCLUDED.min_investment,
  days_left = EXCLUDED.days_left;
