-- Up Migration
-- 1. Update old retired value in ball events to retired_hurt
UPDATE cricket_ball_events SET wicket_type = 'retired_hurt' WHERE wicket_type = 'retired';

-- 2. Alter how_out enum to support retired_hurt and retired_out
ALTER TYPE "cricket_player_match_stats_how_out_enum" ADD VALUE IF NOT EXISTS 'retired_hurt';
ALTER TYPE "cricket_player_match_stats_how_out_enum" ADD VALUE IF NOT EXISTS 'retired_out';

-- 3. Update existing how_out = 'retired' to 'retired_hurt'
UPDATE cricket_player_match_stats SET how_out = 'retired_hurt' WHERE how_out = 'retired';

-- 4. Add status column to cricket_player_match_stats
ALTER TABLE cricket_player_match_stats ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'not_batted';

-- 5. Update existing status values for match stats
UPDATE cricket_player_match_stats 
SET status = CASE 
  WHEN how_out = 'retired_hurt' THEN 'retired_hurt'
  WHEN how_out = 'retired_out' THEN 'retired_out'
  WHEN how_out IS NOT NULL THEN 'out'
  WHEN is_not_out = true AND (runs > 0 OR balls_faced > 0) THEN 'out'
  ELSE 'not_batted'
END;
