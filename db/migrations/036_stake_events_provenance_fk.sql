-- Migration 036: Stake Profile Events Provenance FK
-- SPEC-S02-A (EPIC-014): Link user profile stake events to mint provenance registry

ALTER TABLE user_profile_stake_events
  ADD COLUMN IF NOT EXISTS provenance_id TEXT;

CREATE INDEX IF NOT EXISTS user_profile_stake_events_provenance_idx
  ON user_profile_stake_events (provenance_id)
  WHERE provenance_id IS NOT NULL;

COMMENT ON COLUMN user_profile_stake_events.provenance_id IS
  'Optional link to asset_project_origins. Validated mint provenance for the asset being staked/unstaked.';
