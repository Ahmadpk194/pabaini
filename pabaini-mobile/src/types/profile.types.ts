import { CricketRole, BattingHand, BowlingArm, BowlingType } from './sports.types';
import { Role } from './index';

export interface PublicUser {
  id: number;
  name: string;
  avatar_url: string | null;
  village: string | null;
  is_diaspora: boolean;
  role: Role;
  created_at: string;
}

export interface CricketTierStats {
  matches: number;
  innings: number;
  runs: number;
  highest_score: number;
  average: number;
  strike_rate: number;
  fours: number;
  sixes: number;
  wickets: number;
  best_bowling: string | null;
  economy: number;
}

export interface CricketProfileBundle {
  player_profile: {
    id: number;
    role: CricketRole;
    batting_hand: BattingHand;
    bowling_arm: BowlingArm;
    bowling_type: BowlingType;
  };
  stats: {
    competitive: CricketTierStats;
    casual: CricketTierStats;
  };
  current_teams: Array<{ id: number; name: string; logo_url: string | null; role: string }>;
  past_teams: Array<{ id: number; name: string; logo_url: string | null; left_at: string }>;
  trophies: any[];
}
