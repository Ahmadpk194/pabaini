# Implementation Plan - Flexible Cricket Lineup & Dynamic Wickets

Change the cricket match lineup requirement from a fixed 11-player constraint to a flexible range of 6 to 11 players. Calculate the wickets-per-innings dynamically (declared players - 1) when starting matches, store player counts and wickets limits on the match record, and update the scoring and scorecard views to honor these limits.

## User Review Required

> [!IMPORTANT]
> - Pre-existing matches created before this update will default to **10 wickets** (11 players), ensuring backward compatibility.
> - The minimum player count for lineup declaration is set to **6**, and the maximum is **11**.

## Proposed Changes

---

### Backend Updates

#### [MODIFY] [cricket-match.entity.ts](file:///c:/dev/pabaini/pabaini-backend/src/modules/sports/cricket/matches/entities/cricket-match.entity.ts)
- Add new columns:
  - `team_a_player_count`: nullable integer.
  - `team_b_player_count`: nullable integer.
  - `team_a_max_wickets`: nullable integer defaulting to 10.
  - `team_b_max_wickets`: nullable integer defaulting to 10.

#### [NEW] [1718742800000-add-flexible-lineup-columns.sql](file:///c:/dev/pabaini/pabaini-backend/src/migrations/1718742800000-add-flexible-lineup-columns.sql)
- SQL migration script:
  ```sql
  -- Up Migration
  -- Add player count and max wickets columns to cricket_matches
  ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_a_player_count INTEGER NULL;
  ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_b_player_count INTEGER NULL;
  ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_a_max_wickets INTEGER NULL DEFAULT 10;
  ALTER TABLE cricket_matches ADD COLUMN IF NOT EXISTS team_b_max_wickets INTEGER NULL DEFAULT 10;
  ```

#### [MODIFY] [matches.service.ts](file:///c:/dev/pabaini/pabaini-backend/src/modules/sports/cricket/matches/matches.service.ts)
- **`declareLineup` method**:
  - Relax size verification from `dto.players.length !== 11` to `dto.players.length < 6 || dto.players.length > 11`.
  - Relax unique batting order constraint validation check to match the actual number of players.
  - Set `team_a_player_count` or `team_b_player_count` dynamically on the match record.
- **`startMatch` method**:
  - Calculate `team_a_max_wickets = (team_a_player_count ?? 11) - 1`.
  - Calculate `team_b_max_wickets = (team_b_player_count ?? 11) - 1`.
  - Save them to the match record at start.
- **`recordBall` method**:
  - Dynamically load `maxWickets` for the currently batting team: `team_a_max_wickets` or `team_b_max_wickets` (default to 10 if null).
  - Update `willNeedNextBatsman` check to use `currentWickets < (maxWickets - 1)`.
  - Update striker cleared check and innings/match end check to use `maxWickets` instead of the hardcoded `10` limit.

---

### Mobile Updates

#### [MODIFY] [sports.types.ts](file:///c:/dev/pabaini/pabaini-mobile/src/types/sports.types.ts)
- Extend `CricketMatch` type definition to include:
  - `team_a_player_count?: number | null;`
  - `team_b_player_count?: number | null;`
  - `team_a_max_wickets?: number | null;`
  - `team_b_max_wickets?: number | null;`

#### [MODIFY] [lineup.tsx](file:///c:/dev/pabaini/pabaini-mobile/app/sports/cricket/matches/%5Bid%5D/lineup.tsx)
- Define constants `MIN_PLAYERS = 6` and `MAX_PLAYERS = 11`.
- Update squad list toggling and guest adding validation to check against `MAX_PLAYERS` instead of `11`.
- Update counter header layout:
  - Text: `"Selected Players: X/11 (min 6)"`.
  - Muted description: `"Village cricket — between 6 and 11 players"`.
  - Muted progress indicator:
    - Below 6: `"Need Y more to start"` (red).
    - 6-10: `"Ready · add more if available"` (green).
    - 11: `"Full squad"` (primary).
- Update batting order section header to read `"Batting Order (1 - X)"` dynamically.
- Update submit button disabled status and color evaluation check to allow values between `MIN_PLAYERS` and `MAX_PLAYERS`.

#### [MODIFY] [score.tsx](file:///c:/dev/pabaini/pabaini-mobile/app/sports/cricket/matches/%5Bid%5D/score.tsx)
- Calculate `maxWickets` dynamically using the current innings batting team:
  - If current innings is 1: `match.innings_1_batting_team_id === match.team_a_id ? team_a_max_wickets : team_b_max_wickets`.
  - If current innings is 2: `match.innings_2_batting_team_id === match.team_a_id ? team_a_max_wickets : team_b_max_wickets`.
  - Default to 10 if null.
- Update innings/match end checks to use `maxWickets` instead of hardcoded `10`.

#### [MODIFY] [MatchScorecard.tsx](file:///c:/dev/pabaini/pabaini-mobile/src/components/sports/matches/MatchScorecard.tsx)
- In winning team margin check (runs/wickets difference), calculate `maxWickets` by retrieving `team_a_max_wickets` or `team_b_max_wickets` (falling back to player list length minus 1 or 10 if not present).

---

## Verification Plan

### Automated Tests
- Run `npm run test` or check backend compilation/start script to ensure no typescript issues.

### Manual Verification
- Declare team A lineup with 7 players, and team B with 8 players.
- Verify counter progress labels and submit states on mobile lineup screens.
- Start the live match. Verify that scorer transitions innings when the 6th wicket falls for team A (since max wickets is 6), and when 7th wicket falls for team B (since max wickets is 7).
- Confirm win margins on scorecards are calculated with correct wickets differential.
