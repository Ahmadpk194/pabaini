-- Up Migration
-- Add player count and max wickets columns to cricket_matches
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_a_player_count INTEGER NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_b_player_count INTEGER NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_a_max_wickets INTEGER NULL DEFAULT 10;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_b_max_wickets INTEGER NULL DEFAULT 10;
