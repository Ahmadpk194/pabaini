export interface SportConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  onboardingSteps: string[];
  profileRoute: string;
  apiBase: string;
}

export type CricketRole = 'batsman' | 'bowler' | 'allrounder' | 'keeper';
export type BattingHand = 'right' | 'left';
export type BowlingArm = 'right' | 'left' | 'none';
export type BowlingType = 'fast' | 'medium' | 'spin' | 'none';

export interface CricketOnboardingData {
  role: CricketRole | null;
  batting_hand: BattingHand | null;
  bowling_arm: BowlingArm | null;
  bowling_type: BowlingType | null;
}

export interface CricketPlayerProfile {
  id: number;
  role: CricketRole;
  batting_hand: BattingHand;
  bowling_arm: BowlingArm;
  bowling_type: BowlingType;
  is_active: boolean;
  user: {
    id: number;
    name: string;
    avatar_url: string | null;
  };
}

export interface PlayerRegistration {
  sportId: string;
  isRegistered: boolean;
  profile: CricketPlayerProfile | null;
}

export type TeamMemberRole = 'captain' | 'vice_captain' | 'player';
export type TeamMemberStatus = 'pending_invite' | 'pending_request' | 'active' | 'rejected' | 'left';

export interface TeamSummary {
  id: number;
  name: string;
  logo_url: string | null;
  home_ground: string | null;
  founded_year: number | null;
  captain: {
    id: number;
    user: { id: number; name: string; avatar_url: string | null };
  };
  member_count: number;
  created_at: string;
}

export interface TeamMember {
  id: number;
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joined_at: string | null;
  player: {
    id: number;
    role: CricketRole;
    batting_hand: BattingHand;
    bowling_arm: BowlingArm;
    bowling_type: BowlingType;
    user: { id: number; name: string; avatar_url: string | null };
  };
}

export interface TeamFull extends Omit<TeamSummary, 'member_count'> {
  description: string | null;
  members: TeamMember[];
  updated_at: string;
}

export interface PendingMembers {
  pending_requests: TeamMember[];
  pending_invites: TeamMember[];
}

export interface CreateTeamPayload {
  name: string;
  description?: string;
  home_ground?: string;
  founded_year?: number;
}

export interface MyTeamResponse {
  id: number;
  name: string;
  logo_url: string | null;
  home_ground: string | null;
  founded_year: number | null;
  captain: {
    id: number;
    user: { id: number; name: string; avatar_url: string | null };
  };
  role: TeamMemberRole;
  status: TeamMemberStatus;
  joined_at: string;
}

export type MatchStatus = 'pending_request' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'no_result';
export type MatchScoringMode = 'simple' | 'live';

export interface MatchPlayerStat {
  id?: number;
  match_id?: number;
  team_id: number;
  player_id?: number | null;
  guest_name?: string | null;
  name?: string;
  avatar_url?: string | null;
  runs: number;
  balls_faced: number;
  fours: number;
  sixes: number;
  how_out?: string | null;
  is_not_out: boolean;
  overs_bowled: number;
  runs_given: number;
  wickets: number;
  wides: number;
  no_balls: number;
  maidens?: number | null;
}

export interface CricketMatch {
  id: number;
  series_id: number | null;
  tournament_id: number | null;
  team_a_id: number;
  team_b_id: number;
  requested_by: number;
  overs: number;
  venue: string | null;
  scheduled_at: string | null;
  scoring_mode: MatchScoringMode | null;
  scorer_id: number | null;
  status: MatchStatus;
  winner_team_id: number | null;
  man_of_match_id: number | null;
  man_of_match_guest_name: string | null;
  team_a_score: string | null;
  team_b_score: string | null;
  team_a_lineup_set: boolean;
  team_b_lineup_set: boolean;
  team_a_player_count?: number | null;
  team_b_player_count?: number | null;
  team_a_max_wickets?: number | null;
  team_b_max_wickets?: number | null;
  result_submitted_at: string | null;
  result_locked_at: string | null;
  created_at: string;
  updated_at: string;
  
  // Live scoring fields
  current_innings?: number | null;
  current_over?: number;
  current_ball?: number;
  current_batting_team_id?: number | null;
  striker_id?: number | null;
  striker_guest_name?: string | null;
  non_striker_id?: number | null;
  non_striker_guest_name?: string | null;
  current_bowler_id?: number | null;
  current_bowler_guest_name?: string | null;
  innings_1_score?: number;
  innings_1_wickets?: number;
  innings_1_overs?: number;
  innings_1_batting_team_id?: number | null;
  innings_2_score?: number;
  innings_2_wickets?: number;
  innings_2_overs?: number;
  innings_2_batting_team_id?: number | null;
  target?: number | null;
  last_ball_event_id?: number | null;
  is_tie?: boolean;
  batting_first_team_id?: number | null;
  toss_winner_team_id?: number | null;
  
  // Populated relations
  team_a: {
    id: number;
    name: string;
    logo_url: string | null;
    captain: { id: number; user: { id: number; name: string; avatar_url: string | null } };
  };
  team_b: {
    id: number;
    name: string;
    logo_url: string | null;
    captain: { id: number; user: { id: number; name: string; avatar_url: string | null } };
  };
  winner_team?: { id: number; name: string; logo_url: string | null } | null;
  man_of_match?: { id: number; user: { id: number; name: string; avatar_url: string | null } } | null;
  scorer?: { id: number; user: { id: number; name: string; avatar_url: string | null } } | null;
  requester?: { id: number; user: { id: number; name: string; avatar_url: string | null } } | null;
  player_stats?: MatchPlayerStat[];
  is_result_editable?: boolean;
  innings_1_byes?: number | null;
  innings_1_leg_byes?: number | null;
  innings_2_byes?: number | null;
  innings_2_leg_byes?: number | null;
  fall_of_wickets?: Array<{
    player_name: string;
    wicket_type: string;
    over: string;
    score_at_wicket: number;
    innings: number;
  }> | null;
}

export interface RequestMatchPayload {
  opponent_team_id: number;
  overs: number;
  scoring_mode: MatchScoringMode;
  venue?: string;
  scheduled_at?: string;
}

export interface UpdateMatchPayload {
  overs?: number;
  scoring_mode?: MatchScoringMode;
  venue?: string;
  scheduled_at?: string;
}


