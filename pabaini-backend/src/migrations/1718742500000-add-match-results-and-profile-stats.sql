-- Up Migration
-- Add columns to cricket_matches
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS result_submitted_at TIMESTAMP NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS result_locked_at TIMESTAMP NULL;

-- Add columns to cricket_player_profiles
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_matches INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_runs INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_balls_faced INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_fours INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_sixes INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS highest_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_wickets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_overs_bowled DECIMAL(5,1) NOT NULL DEFAULT 0;
ALTER TABLE cricket_player_profiles ADD COLUMN IF NOT EXISTS total_runs_given INTEGER NOT NULL DEFAULT 0;
