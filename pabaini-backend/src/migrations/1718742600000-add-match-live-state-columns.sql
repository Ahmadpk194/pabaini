-- Up Migration
-- Add live state columns to cricket_matches
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_innings INTEGER NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_over INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_ball INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_batting_team_id INTEGER NULL REFERENCES cricket_teams(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS striker_id INTEGER NULL REFERENCES cricket_player_profiles(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS striker_guest_name VARCHAR(100) NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS non_striker_id INTEGER NULL REFERENCES cricket_player_profiles(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS non_striker_guest_name VARCHAR(100) NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_bowler_id INTEGER NULL REFERENCES cricket_player_profiles(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS current_bowler_guest_name VARCHAR(100) NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_1_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_1_wickets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_1_overs DECIMAL(4,1) NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_1_batting_team_id INTEGER NULL REFERENCES cricket_teams(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_2_score INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_2_wickets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_2_overs DECIMAL(4,1) NOT NULL DEFAULT 0;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS innings_2_batting_team_id INTEGER NULL REFERENCES cricket_teams(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS target INTEGER NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS last_ball_event_id INTEGER NULL REFERENCES cricket_ball_events(id) ON DELETE SET NULL;
ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS is_tie BOOLEAN NOT NULL DEFAULT false;
