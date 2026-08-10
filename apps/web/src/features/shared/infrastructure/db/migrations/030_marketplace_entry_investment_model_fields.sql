ALTER TABLE marketplace_entries
  ADD COLUMN IF NOT EXISTS project_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS economics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS governance_json JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN marketplace_entries.project_json IS
  'Structured project execution metadata for marketplace detail rendering.';

COMMENT ON COLUMN marketplace_entries.economics_json IS
  'Structured deal economics captured from the admin investment-model form.';

COMMENT ON COLUMN marketplace_entries.governance_json IS
  'Structured governance and risk narrative for marketplace detail rendering.';
