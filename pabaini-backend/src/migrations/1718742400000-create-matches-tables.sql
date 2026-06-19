-- Up Migration
-- Create cricket_series table
CREATE TABLE IF NOT EXISTS cricket_series (
  id SERIAL PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  team_a_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  team_b_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  total_matches INTEGER NOT NULL,
  team_a_wins INTEGER NOT NULL DEFAULT 0,
  team_b_wins INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
  created_by INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create cricket_matches table
CREATE TABLE IF NOT EXISTS cricket_matches (
  id SERIAL PRIMARY KEY,
  series_id INTEGER REFERENCES cricket_series(id) ON DELETE SET NULL,
  tournament_id INTEGER,
  team_a_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  team_b_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  requested_by INTEGER NOT NULL REFERENCES cricket_player_profiles(id) ON DELETE CASCADE,
  overs INTEGER NOT NULL,
  venue VARCHAR(200),
  scheduled_at TIMESTAMP,
  scoring_mode VARCHAR(20),
  scorer_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending_request',
  winner_team_id INTEGER REFERENCES cricket_teams(id) ON DELETE SET NULL,
  man_of_match_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  team_a_score VARCHAR(20),
  team_b_score VARCHAR(20),
  team_a_lineup_set BOOLEAN NOT NULL DEFAULT FALSE,
  team_b_lineup_set BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_match_context CHECK (series_id IS NULL OR tournament_id IS NULL)
);

-- Create cricket_match_players table
CREATE TABLE IF NOT EXISTS cricket_match_players (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES cricket_matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  guest_name VARCHAR(100),
  batting_order INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_player_or_guest CHECK (player_id IS NOT NULL OR guest_name IS NOT NULL)
);

-- Create cricket_player_match_stats table
CREATE TABLE IF NOT EXISTS cricket_player_match_stats (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES cricket_matches(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES cricket_teams(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  guest_name VARCHAR(100),
  runs INTEGER NOT NULL DEFAULT 0,
  balls_faced INTEGER NOT NULL DEFAULT 0,
  fours INTEGER NOT NULL DEFAULT 0,
  sixes INTEGER NOT NULL DEFAULT 0,
  how_out VARCHAR(50),
  is_not_out BOOLEAN NOT NULL DEFAULT FALSE,
  overs_bowled DECIMAL(4,1) NOT NULL DEFAULT 0,
  runs_given INTEGER NOT NULL DEFAULT 0,
  wickets INTEGER NOT NULL DEFAULT 0,
  wides INTEGER NOT NULL DEFAULT 0,
  no_balls INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create cricket_ball_events table
CREATE TABLE IF NOT EXISTS cricket_ball_events (
  id SERIAL PRIMARY KEY,
  match_id INTEGER NOT NULL REFERENCES cricket_matches(id) ON DELETE CASCADE,
  innings INTEGER NOT NULL,
  over_number INTEGER NOT NULL,
  ball_number INTEGER NOT NULL,
  batsman_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  bowler_id INTEGER REFERENCES cricket_player_profiles(id) ON DELETE SET NULL,
  batsman_guest_name VARCHAR(100),
  bowler_guest_name VARCHAR(100),
  runs INTEGER NOT NULL DEFAULT 0,
  extra_type VARCHAR(20),
  extra_runs INTEGER NOT NULL DEFAULT 0,
  is_wicket BOOLEAN NOT NULL DEFAULT FALSE,
  wicket_type VARCHAR(50),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add unique composite index on cricket_ball_events
CREATE UNIQUE INDEX IF NOT EXISTS idx_ball_events_unique ON cricket_ball_events(match_id, innings, over_number, ball_number);
