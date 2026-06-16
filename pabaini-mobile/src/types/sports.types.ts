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
  joined_at: string;
}

